import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Plus,
  X,
  History,
  ShoppingCart,
  ScanLine,
  AlertTriangle,
} from "lucide-react-native";
import { useProducts } from "@modules/product/hooks/useProducts";
import { inventoryApi } from "@modules/inventory/api/inventoryApi";
import {
  useCustomers,
  useCreateCustomer,
} from "@modules/customer/hooks/useCustomers";
import { useCreateSale } from "@modules/sale/hooks/useSales";
import { SaleLineInput } from "@modules/sale/types";
import { apiErrorMessage } from "@api/apiClient";
import { palette, radius } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  TextField,
  Select,
  ChipsRow,
} from "@shared/ui";

interface DraftLine {
  productId: string | null;
  /** Set when the line came from a scanned label — pins the sale to this lot. */
  batchId?: string | null;
  batchNumber?: string | null;
  expiry?: string | null;
  unit: string | null;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
}
const emptyLine = (): DraftLine => ({
  productId: null,
  batchId: null,
  batchNumber: null,
  expiry: null,
  unit: null,
  quantity: "1",
  unitPrice: "",
  discount: "",
  taxRate: "",
});

/** "2028-01-31" / ISO -> "Jan 2028" for a quick human read on a line. */
const prettyExp = (iso: string | null | undefined) => {
  if (!iso) return "";
  const [y, m] = String(iso).slice(0, 10).split("-");
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  return `${months[Number(m) - 1] || m} ${y}`;
};
const money = (n: number) =>
  `₹${(Math.round(n * 100) / 100).toLocaleString("en-IN")}`;

export default function NewSaleScreen() {
  const navigation = useNavigation<any>();
  // Catalogue and customer list are both paged — the pickers search server-side
  // and we cache what's been resolved. Without the cache a product outside the
  // current results loses its price and the line total silently computes to ₹0.
  const [productQuery, setProductQuery] = useState("");
  const { data: products, isFetching: productsLoading } = useProducts({
    search: productQuery || undefined,
    limit: 50,
  });
  const [customerQuery, setCustomerQuery] = useState("");
  const { data: customers, isFetching: customersLoading } = useCustomers({
    search: customerQuery || undefined,
  });
  const createCustomer = useCreateCustomer();
  const mut = useCreateSale();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [taxType, setTaxType] = useState<"intra" | "inter">("intra");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [scanValue, setScanValue] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  type ProductRow = NonNullable<typeof products>["data"][number];
  type CustomerRow = NonNullable<typeof customers>["data"][number];
  const [knownProducts, setKnownProducts] = useState<
    Record<string, ProductRow>
  >({});
  const [knownCustomers, setKnownCustomers] = useState<
    Record<string, CustomerRow>
  >({});

  /** Cache + live results — this is what the pricing maths reads from. */
  const productsById = useMemo(() => {
    const map: Record<string, ProductRow> = { ...knownProducts };
    for (const p of products?.data || []) map[p.id] = p;
    return map;
  }, [products, knownProducts]);

  /** Pickers list search results only; the catalogue is far too big to list. */
  // Show the salt too: a search for "pantoprazole" returns brand names, and the
  // molecule is what tells you why each one matched.
  const productOptions = (products?.data || []).map((p) => ({
    value: p.id,
    label: p.saltComposition
      ? `${p.name} · ${money(p.sellingPrice)}/${p.baseUnit} — ${p.saltComposition}`
      : `${p.name} · ${money(p.sellingPrice)}/${p.baseUnit}`,
  }));
  const customerOptions = (customers?.data || []).map((c) => ({
    value: c.id,
    label: c.mobile ? `${c.name} · ${c.mobile}` : c.name,
  }));

  const selectedCustomer = customerId
    ? knownCustomers[customerId] ||
      (customers?.data || []).find((c) => c.id === customerId)
    : null;

  /** Remember each pick so its label/price survives the next search. */
  const pickCustomer = (id: string | null) => {
    const c = id ? (customers?.data || []).find((x) => x.id === id) : null;
    if (c) setKnownCustomers((cur) => ({ ...cur, [c.id]: c }));
    setCustomerId(id);
  };

  const unitOptions = (productId: string | null) => {
    const p = productId ? productsById[productId] : null;
    if (!p) return [];
    return [
      { value: p.baseUnit, label: `${p.baseUnit} (base)` },
      ...(p.packs || []).map((pk) => ({
        value: pk.unit,
        label: `${pk.unit} (×${pk.factor})`,
      })),
    ];
  };

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((cur) =>
      cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  const addLine = () => setLines((cur) => [...cur, emptyLine()]);

  /** Drop a resolved line into the first blank slot, else append. */
  const placeLine = (line: DraftLine) =>
    setLines((cur) => {
      const blank = cur.findIndex((l) => !l.productId);
      return blank >= 0
        ? cur.map((l, k) => (k === blank ? line : l))
        : [...cur, line];
    });

  /**
   * A scanned barcode/QR from the counter's scanner (which types the code +
   * Enter). A shelf label resolves to an exact lot and pins the sale to it; a
   * product barcode adds a normal FEFO line. Scanning the same lot again just
   * bumps its quantity — the supermarket-till behaviour.
   */
  const handleScan = async (raw: string) => {
    const code = raw.trim();
    if (!code || scanBusy) return;
    setScanError(null);
    setScanBusy(true);
    try {
      const res = await inventoryApi.scan(code);
      const sp = res.product;
      if (!sp) throw new Error("Nothing matched that code.");
      // Cache it so the pricing maths can read this product after searches move on.
      setKnownProducts((cur) => ({
        ...cur,
        [sp.id]: sp as unknown as ProductRow,
      }));

      if (res.kind === "batch" && res.batch) {
        const b = res.batch;
        if (b.expired) {
          setScanError(
            `${sp.name} · batch ${b.batchNumber} has EXPIRED — not added.`,
          );
          return;
        }
        if (res.available <= 0) {
          setScanError(`${sp.name} · batch ${b.batchNumber} is out of stock.`);
          return;
        }
        setLines((cur) => {
          const idx = cur.findIndex((l) => l.batchId === b.id);
          if (idx >= 0) {
            return cur.map((l, k) =>
              k === idx
                ? { ...l, quantity: String((Number(l.quantity) || 0) + 1) }
                : l,
            );
          }
          const line: DraftLine = {
            productId: sp.id,
            batchId: b.id,
            batchNumber: b.batchNumber,
            expiry: b.expiryDate,
            unit: sp.baseUnit,
            quantity: "1",
            unitPrice: String(b.mrp || sp.sellingPrice),
            discount: "",
            taxRate: String(sp.taxRatePct),
          };
          const blank = cur.findIndex((l) => !l.productId);
          return blank >= 0
            ? cur.map((l, k) => (k === blank ? line : l))
            : [...cur, line];
        });
      } else {
        // Product barcode: a normal line, FEFO decides the batch at checkout.
        placeLine({
          productId: sp.id,
          batchId: null,
          batchNumber: null,
          expiry: null,
          unit: sp.baseUnit,
          quantity: "1",
          unitPrice: String(sp.sellingPrice),
          discount: "",
          taxRate: String(sp.taxRatePct),
        });
      }
    } catch (e) {
      setScanError(apiErrorMessage(e));
    } finally {
      setScanBusy(false);
    }
  };
  const removeLine = (i: number) =>
    setLines((cur) =>
      cur.length === 1 ? cur : cur.filter((_, idx) => idx !== i),
    );

  // Client-side preview (tax-exclusive). Backend computes the authoritative totals.
  const calc = (l: DraftLine) => {
    const p = l.productId ? productsById[l.productId] : null;
    if (!p) return { gross: 0, discount: 0, taxable: 0, tax: 0, total: 0 };
    const factor =
      !l.unit || l.unit === p.baseUnit
        ? 1
        : (p.packs || []).find((x) => x.unit === l.unit)?.factor || 1;
    const qty = Number(l.quantity) || 0;
    const unitPrice =
      l.unitPrice === "" ? p.sellingPrice * factor : Number(l.unitPrice) || 0;
    const gross = unitPrice * qty;
    const discount = Number(l.discount) || 0;
    const taxable = Math.max(gross - discount, 0);
    const rate = l.taxRate === "" ? p.taxRatePct : Number(l.taxRate) || 0;
    const tax = (taxable * rate) / 100;
    return { gross, discount, taxable, tax, total: taxable + tax };
  };

  const totals = lines.reduce(
    (acc, l) => {
      const c = calc(l);
      acc.subtotal += c.gross;
      acc.discount += c.discount;
      acc.taxable += c.taxable;
      acc.tax += c.tax;
      return acc;
    },
    { subtotal: 0, discount: 0, taxable: 0, tax: 0 },
  );
  const grand = Math.round(totals.taxable + totals.tax);

  const validLines: SaleLineInput[] = lines
    .filter((l) => l.productId && Number(l.quantity) > 0)
    .map((l) => ({
      productId: l.productId!,
      batchId: l.batchId || undefined,
      unit: l.unit || undefined,
      quantity: Number(l.quantity),
      unitPrice: l.unitPrice === "" ? undefined : Number(l.unitPrice),
      discountAmount: l.discount === "" ? undefined : Number(l.discount),
      taxRatePct: l.taxRate === "" ? undefined : Number(l.taxRate),
    }));

  const submit = () => {
    if (!validLines.length) return;
    mut.mutate(
      {
        customerId,
        taxType,
        paymentMode: paymentMode as never,
        lines: validLines,
      },
      {
        onSuccess: (sale) => navigation.navigate("SaleDetail", { id: sale.id }),
      },
    );
  };

  return (
    <Screen
      overline="Sales"
      title="New sale"
      subtitle="FEFO auto-picks nearest-expiry batches at checkout"
      right={
        <Button
          label="Invoices"
          variant="secondary"
          fullWidth={false}
          icon={
            <History size={16} color={palette.text.primary} strokeWidth={2} />
          }
          onPress={() => navigation.navigate("SalesList")}
        />
      }
    >
      {mut.isError && (
        <View style={errorBox}>
          <Text variant="body-sm" tone="danger">
            {apiErrorMessage(mut.error)}
          </Text>
        </View>
      )}

      <Card style={{ marginBottom: 16 }}>
        <VStack gap={16}>
          <Select
            label="Customer (optional — walk-in if blank)"
            placeholder="Search name or mobile…"
            value={customerId}
            options={customerOptions}
            selectedLabel={
              selectedCustomer
                ? selectedCustomer.mobile
                  ? `${selectedCustomer.name} · ${selectedCustomer.mobile}`
                  : selectedCustomer.name
                : undefined
            }
            onSearch={setCustomerQuery}
            loading={customersLoading}
            onChange={pickCustomer}
            onCreate={async (label) => {
              const c = await createCustomer.mutateAsync({ name: label });
              setKnownCustomers((cur) => ({ ...cur, [c.id]: c }));
              return { value: c.id, label: c.name };
            }}
            allowClear
          />
          <View>
            <Text variant="label" tone="secondary" style={{ marginBottom: 8 }}>
              GST type
            </Text>
            <ChipsRow
              chips={[
                { key: "intra", label: "Intra-state (CGST+SGST)" },
                { key: "inter", label: "Inter-state (IGST)" },
              ]}
              active={taxType}
              onChange={(k) => setTaxType(k as never)}
            />
          </View>
          <View>
            <Text variant="label" tone="secondary" style={{ marginBottom: 8 }}>
              Payment
            </Text>
            <ChipsRow
              chips={[
                { key: "cash", label: "Cash" },
                { key: "card", label: "Card" },
                { key: "upi", label: "UPI" },
                { key: "credit", label: "Credit" },
              ]}
              active={paymentMode}
              onChange={setPaymentMode}
            />
          </View>
        </VStack>
      </Card>

      {/* Scan to sell. A counter scanner types the code + Enter, so this box
          stays focused and clears itself after each scan — scan, scan, scan.
          Also accepts a typed code for shops without a scanner yet. */}
      <Card style={{ marginBottom: 16 }}>
        <VStack gap={8}>
          <TextField
            label="Scan barcode / QR"
            placeholder="Scan a shelf label — or type a code and press Enter"
            value={scanValue}
            onChangeText={setScanValue}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              handleScan(scanValue);
              setScanValue("");
            }}
            leading={
              scanBusy ? (
                <ActivityIndicator color={palette.teal[600]} />
              ) : (
                <ScanLine size={18} color={palette.teal[600]} strokeWidth={2} />
              )
            }
          />
          {scanError && (
            <HStack gap={6} align="center">
              <AlertTriangle
                size={14}
                color={palette.warning.text}
                strokeWidth={2.2}
              />
              <Text variant="caption" tone="warning">
                {scanError}
              </Text>
            </HStack>
          )}
        </VStack>
      </Card>

      <VStack gap={14}>
        {lines.map((line, i) => {
          const c = calc(line);
          return (
            <Card key={i} elevation="base">
              <VStack gap={14}>
                <HStack align="center" justify="space-between">
                  <HStack gap={8} align="center" flex={1}>
                    <Text variant="label-lg" tone="primary">
                      Item {i + 1}
                    </Text>
                    {/* A scanned line is pinned to one lot; a badge makes that
                        obvious next to the FEFO-picked (typed) lines. */}
                    {line.batchId && (
                      <View style={styles.lotBadge}>
                        <ScanLine
                          size={11}
                          color={palette.teal[700]}
                          strokeWidth={2.2}
                        />
                        <Text
                          variant="label-sm"
                          style={{ color: palette.teal[700] }}
                        >
                          Batch {line.batchNumber}
                          {line.expiry
                            ? ` · exp ${prettyExp(line.expiry)}`
                            : ""}
                        </Text>
                      </View>
                    )}
                  </HStack>
                  {lines.length > 1 && (
                    <Pressable
                      onPress={() => removeLine(i)}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <X
                        size={16}
                        color={palette.danger.text}
                        strokeWidth={2}
                      />
                    </Pressable>
                  )}
                </HStack>
                <Select
                  label="Product"
                  placeholder="Search by name or SKU…"
                  value={line.productId}
                  options={productOptions}
                  selectedLabel={
                    line.productId && productsById[line.productId]
                      ? `${productsById[line.productId].name} · ${money(productsById[line.productId].sellingPrice)}/${productsById[line.productId].baseUnit}`
                      : undefined
                  }
                  onSearch={setProductQuery}
                  loading={productsLoading}
                  onChange={(v) => {
                    const p = v ? productsById[v] : null;
                    // Cache it — the maths below needs its price after the
                    // search results move on.
                    if (p) setKnownProducts((cur) => ({ ...cur, [p.id]: p }));
                    setLine(i, {
                      productId: v,
                      unit: p?.baseUnit || null,
                      unitPrice: p ? String(p.sellingPrice) : "",
                      taxRate: p ? String(p.taxRatePct) : "",
                    });
                  }}
                />
                <HStack gap={12}>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label="Qty"
                      value={line.quantity}
                      onChangeText={(v) => setLine(i, { quantity: v })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1.3 }}>
                    <Select
                      label="Unit"
                      placeholder="unit"
                      value={line.unit}
                      options={unitOptions(line.productId)}
                      onChange={(v) => setLine(i, { unit: v })}
                    />
                  </View>
                </HStack>
                <HStack gap={12}>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label="Price/unit ₹"
                      value={line.unitPrice}
                      onChangeText={(v) => setLine(i, { unitPrice: v })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label="Discount ₹"
                      value={line.discount}
                      onChangeText={(v) => setLine(i, { discount: v })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label="GST %"
                      value={line.taxRate}
                      onChangeText={(v) => setLine(i, { taxRate: v })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </HStack>
                {line.productId && (
                  <HStack justify="space-between">
                    <Text variant="caption" tone="tertiary">
                      Taxable {money(c.taxable)} + tax {money(c.tax)}
                    </Text>
                    <Text variant="label" tone="accent">
                      {money(c.total)}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Card>
          );
        })}
      </VStack>

      <Pressable onPress={addLine} style={styles.addRow}>
        <Plus size={18} color={palette.teal[600]} strokeWidth={2.2} />
        <Text variant="label" tone="accent">
          Add item
        </Text>
      </Pressable>

      <Card style={{ marginTop: 8, marginBottom: 16 }}>
        <VStack gap={8}>
          <Row label="Subtotal" value={money(totals.subtotal)} />
          {totals.discount > 0 && (
            <Row label="Discount" value={`- ${money(totals.discount)}`} />
          )}
          <Row label="Taxable" value={money(totals.taxable)} />
          {taxType === "intra" ? (
            <>
              <Row label="CGST" value={money(totals.tax / 2)} muted />
              <Row label="SGST" value={money(totals.tax / 2)} muted />
            </>
          ) : (
            <Row label="IGST" value={money(totals.tax)} muted />
          )}
          <View
            style={{
              height: 1,
              backgroundColor: palette.border.default,
              marginVertical: 4,
            }}
          />
          <HStack justify="space-between" align="center">
            <Text variant="h3" tone="primary">
              Grand total
            </Text>
            <Text variant="h2" tone="accent">
              {money(grand)}
            </Text>
          </HStack>
          <Text variant="caption" tone="tertiary">
            Final totals are GST-rounded on the server.
          </Text>
        </VStack>
      </Card>

      <Button
        label="Complete sale & invoice"
        size="lg"
        loading={mut.isPending}
        disabled={!validLines.length}
        onPress={submit}
        icon={<ShoppingCart size={18} color="#FFFFFF" strokeWidth={2} />}
      />
    </Screen>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <HStack justify="space-between">
      <Text variant="body-sm" tone={muted ? "tertiary" : "secondary"}>
        {label}
      </Text>
      <Text variant="label" tone={muted ? "tertiary" : "primary"}>
        {value}
      </Text>
    </HStack>
  );
}

const styles = StyleSheet.create({
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: palette.danger.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  lotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: palette.teal[50],
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    justifyContent: "center",
  },
});

const errorBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.danger.bg,
  borderWidth: 1,
  borderColor: palette.danger.border,
  marginBottom: 16,
} as const;
