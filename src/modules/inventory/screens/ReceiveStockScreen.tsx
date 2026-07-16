import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Plus,
  X,
  History,
  PackageCheck,
  ScanLine,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react-native";
import { useProducts } from "@modules/product/hooks/useProducts";
import { useAllLocations } from "@modules/warehouse/hooks/useWarehouse";
import {
  useSuppliers,
  useCreateSupplier,
} from "@modules/supplier/hooks/useSuppliers";
import { useReceiveStock } from "@modules/inventory/hooks/useInventory";
import { ReceiptLineInput, ScannedBill } from "@modules/inventory/types";
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
} from "@shared/ui";
import { useAuthStore } from "@shared/store/useAuthStore";

/** The bits of a product this screen actually needs to show and do maths with. */
interface ProductLite {
  id: string;
  name: string;
  sku: string;
  baseUnit: string;
  packs: { unit: string; factor: number }[];
}

interface DraftLine {
  productId: string | null;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  unit: string | null;
  quantity: string;
  purchasePrice: string;
  locationId: string | null;
  /** Set when the line came from a scanned bill and needs a human look. */
  flagged?: boolean;
}

const emptyLine = (): DraftLine => ({
  productId: null,
  batchNumber: "",
  mfgDate: "",
  expiryDate: "",
  unit: null,
  quantity: "",
  purchasePrice: "",
  locationId: null,
});

/** ISO date -> YYYY-MM-DD for the date fields. */
const isoToDate = (iso: string | null) => (iso ? String(iso).slice(0, 10) : "");

type Tone = "ok" | "warn" | "todo";

/**
 * What the collapsed row should say. A line is only "Ready" when it has
 * everything the server needs — otherwise the row must say what's missing, so
 * you can spot the gaps without opening 25 forms.
 */
function lineStatus(l: DraftLine): { label: string; tone: Tone } {
  if (!l.productId) return { label: "Product?", tone: "todo" };
  if (!l.batchNumber.trim()) return { label: "Batch?", tone: "todo" };
  if (!(Number(l.quantity) > 0)) return { label: "Qty?", tone: "todo" };
  if (!l.locationId) return { label: "Location?", tone: "todo" };
  if (l.flagged) return { label: "Check", tone: "warn" };
  return { label: "Ready", tone: "ok" };
}

/** One-line gist of a row while it's collapsed. */
function summaryLine(l: DraftLine, p: ProductLite | null): string {
  const bits: string[] = [];
  bits.push(
    l.batchNumber.trim() ? `Batch ${l.batchNumber.trim()}` : "no batch",
  );
  if (Number(l.quantity) > 0) {
    bits.push(`${l.quantity} ${l.unit || p?.baseUnit || "units"}`);
  }
  if (l.expiryDate) bits.push(`exp ${l.expiryDate}`);
  return bits.join(" · ");
}

const pillTone = (t: Tone) =>
  t === "ok"
    ? {
        backgroundColor: palette.success.bg,
        borderColor: palette.success.border,
      }
    : t === "warn"
      ? {
          backgroundColor: palette.warning.bg,
          borderColor: palette.warning.border,
        }
      : {
          backgroundColor: palette.ink[100],
          borderColor: palette.border.default,
        };

const pillTextColor = (t: Tone) =>
  t === "ok"
    ? palette.success.text
    : t === "warn"
      ? palette.warning.text
      : palette.text.tertiary;

/**
 * Turns a scanned bill into form lines.
 *
 * Two rules, both deliberate:
 *  1. Only values our two OCR passes AGREED on are pre-filled — anything
 *     disputed is left BLANK so it must be typed, not rubber-stamped.
 *  2. The bill's QTY counts PACKS and its RATE is per PACK. We only pre-fill the
 *     unit when the server proved which pack it is, and we use the converted
 *     per-base-unit cost. If the pack couldn't be resolved we leave the unit
 *     blank rather than silently defaulting to base units — that mistake booked
 *     "1 ml" for a 60ml bottle.
 */
function linesFromScan(bill: ScannedBill): DraftLine[] {
  return bill.lines.map((l) => {
    const trust = <T,>(f: { value: T; confidence: "high" | "low" }) =>
      f.confidence === "high" ? f.value : null;

    const batch = trust(l.fields.batchNo);
    const qty = trust(l.fields.quantity);
    const expiryOk = l.fields.expiry.confidence === "high";
    const rateOk = l.fields.rate.confidence === "high";
    const unit = l.unitResolution?.resolved ? l.unitResolution.unit : null;
    // Cost is only meaningful once the pack is known AND the rate was agreed.
    const cost = unit && rateOk ? l.costPerBaseUnit : null;

    return {
      productId: l.match?.id || null,
      batchNumber: batch ? String(batch) : "",
      mfgDate: "",
      expiryDate: expiryOk ? isoToDate(l.expiryDate) : "",
      unit,
      quantity: qty != null ? String(qty) : "",
      purchasePrice: cost != null ? String(cost) : "",
      locationId: null,
      flagged: l.needsReview || !l.match,
    };
  });
}

export default function ReceiveStockScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // The catalogue can run to tens of thousands of items, so we never try to load
  // it all: the product picker searches server-side and we keep a local cache of
  // everything we've already resolved (scan matches + past picks).
  const [productQuery, setProductQuery] = useState("");
  const { data: products, isFetching: productsLoading } = useProducts({
    search: productQuery || undefined,
    limit: 50,
  });
  const { data: locations } = useAllLocations();
  const canManageSuppliers = useAuthStore((s) => s.hasPermission)(
    "suppliers.manage",
  );
  const { data: suppliers } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const mut = useReceiveStock();

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [referenceNo, setReference] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [done, setDone] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  /**
   * Every product we've resolved — scanner matches plus anything the user picks.
   * The picker only ever searches a slice of the catalogue, so without this
   * cache a chosen product would lose its name and unit as soon as the search
   * text changed.
   */
  const [knownProducts, setKnownProducts] = useState<
    Record<string, ProductLite>
  >({});
  /**
   * Which rows are open. Collapsed by default: a scanned 25-line bill has to be
   * scannable at a glance, not a kilometre of forms.
   */
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggleExpanded = (i: number) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // A scanned bill arrives as a route param — fill the form from it once, then
  // clear the param so a re-render can't wipe the pharmacist's edits.
  const scanned: ScannedBill | undefined = route.params?.scanned;
  /* eslint-disable react-hooks/set-state-in-effect -- consuming a one-shot
     route param: the scan result only exists once navigation delivers it. */
  useEffect(() => {
    if (!scanned) return;
    const flagged = scanned.lines.filter(
      (l) => l.needsReview || !l.match,
    ).length;
    const from = scanned.supplierName || "the bill";
    const matched: Record<string, ProductLite> = {};
    scanned.lines.forEach((l) => {
      if (l.match) {
        matched[l.match.id] = {
          id: l.match.id,
          name: l.match.name,
          sku: l.match.sku,
          baseUnit: l.match.baseUnit,
          packs: l.match.packs || [],
        };
      }
    });
    setKnownProducts((cur) => ({ ...cur, ...matched }));
    setLines(linesFromScan(scanned));
    // Every row collapsed — the point of scanning 25 lines is to see them all.
    setExpanded(new Set());
    setReference(scanned.invoiceNo || "");
    // Auto-link the supplier when the server matched one confidently.
    if (scanned.supplierMatch) setSupplierId(scanned.supplierMatch.id);
    setScanNote(
      flagged > 0
        ? `${scanned.stats.total} lines from ${from} — ${flagged} need a check (unclear values were left blank). Pick a storage location for each line.`
        : `${scanned.stats.total} lines from ${from} read cleanly. Pick a storage location for each line.`,
    );
    // A repeat invoice would double the stock — say so loudly, don't block.
    setDuplicateWarning(
      scanned.duplicate
        ? `Invoice ${scanned.duplicate.referenceNo} was already received as ${scanned.duplicate.receiptNo} on ${new Date(scanned.duplicate.receivedAt).toLocaleDateString()}. Saving again will DOUBLE this stock.`
        : null,
    );
    navigation.setParams({ scanned: undefined });
  }, [scanned, navigation]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const supplierOptions = (suppliers?.data || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  /** Current search results, as ProductLite. */
  const searchResults = useMemo<ProductLite[]>(
    () =>
      (products?.data || []).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        baseUnit: p.baseUnit,
        packs: p.packs || [],
      })),
    [products],
  );

  /**
   * Lookup for anything already on the form: the cache first, topped up with the
   * current results. Used to render names and do the unit maths — never to
   * populate the picker (that must show search results only).
   */
  const productsById = useMemo(() => {
    const map: Record<string, ProductLite> = { ...knownProducts };
    for (const p of searchResults) map[p.id] = p;
    return map;
  }, [searchResults, knownProducts]);

  /** The picker lists only what the search returned — the catalogue is far too big to list. */
  const productOptions = useMemo(
    () =>
      searchResults.map((p) => ({
        value: p.id,
        label: `${p.name} · ${p.sku}`,
      })),
    [searchResults],
  );

  /** Remember every pick so its name/unit survives the next search. */
  const pickProduct = (i: number, id: string | null) => {
    const p = id ? productsById[id] : null;
    if (p) setKnownProducts((cur) => ({ ...cur, [p.id]: p }));
    setLine(i, { productId: id, unit: p?.baseUnit || null });
  };
  const locationOptions = (locations || []).map((l) => ({
    value: l.id,
    label: `${l.code} — ${l.name}`,
  }));

  const unitOptions = (productId: string | null) => {
    const p = productId ? productsById[productId] : null;
    if (!p) return [];
    return [
      { value: p.baseUnit, label: `${p.baseUnit} (base)` },
      ...(p.packs || []).map((pk) => ({
        value: pk.unit,
        label: `${pk.unit} (×${pk.factor} ${p.baseUnit})`,
      })),
    ];
  };

  const baseQty = (l: DraftLine) => {
    const p = l.productId ? productsById[l.productId] : null;
    const qty = Number(l.quantity) || 0;
    if (!p) return 0;
    if (!l.unit || l.unit === p.baseUnit) return qty;
    const pk = (p.packs || []).find((x) => x.unit === l.unit);
    return pk ? qty * pk.factor : qty;
  };
  const totalBase = lines.reduce((s, l) => s + baseQty(l), 0);

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((cur) =>
      cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  // A manually-added line is always the one you want to fill in next.
  const addLine = () =>
    setLines((cur) => {
      setExpanded((e) => new Set(e).add(cur.length));
      return [...cur, emptyLine()];
    });
  const removeLine = (i: number) =>
    setLines((cur) =>
      cur.length === 1 ? cur : cur.filter((_, idx) => idx !== i),
    );

  const validLines: ReceiptLineInput[] = lines
    .filter(
      (l) =>
        l.productId &&
        l.batchNumber.trim() &&
        Number(l.quantity) > 0 &&
        l.locationId,
    )
    .map((l) => ({
      productId: l.productId!,
      batchNumber: l.batchNumber.trim(),
      mfgDate: l.mfgDate.trim() || undefined,
      expiryDate: l.expiryDate.trim() || undefined,
      purchasePrice:
        l.purchasePrice === "" ? undefined : Number(l.purchasePrice),
      unit: l.unit || undefined,
      quantity: Number(l.quantity),
      locationId: l.locationId!,
    }));

  const submit = () => {
    if (!validLines.length) return;
    mut.mutate(
      {
        supplierId,
        referenceNo: referenceNo.trim() || undefined,
        lines: validLines,
      },
      {
        onSuccess: (r) => {
          setDone(r.receiptNo);
          setLines([emptyLine()]);
          setSupplierId(null);
          setReference("");
        },
      },
    );
  };

  return (
    <Screen
      overline="Stock Inward"
      title="Receive stock"
      subtitle="Goods received note — batch, expiry, location & cost"
      right={
        <HStack gap={8}>
          <Button
            label="Scan bill"
            fullWidth={false}
            icon={<ScanLine size={16} color="#FFFFFF" strokeWidth={2} />}
            onPress={() => navigation.navigate("ScanBill")}
          />
          <Button
            label="History"
            variant="secondary"
            fullWidth={false}
            icon={
              <History size={16} color={palette.text.primary} strokeWidth={2} />
            }
            onPress={() => navigation.navigate("Receipts")}
          />
        </HStack>
      }
    >
      {duplicateWarning && (
        <View style={warnBox}>
          <HStack gap={8} align="flex-start">
            <AlertTriangle
              size={16}
              color={palette.warning.text}
              strokeWidth={2.2}
            />
            <Text
              variant="body-sm"
              style={{ color: palette.warning.text, flex: 1 }}
            >
              {duplicateWarning}
            </Text>
          </HStack>
        </View>
      )}
      {scanNote && (
        <View style={infoBox}>
          <HStack gap={8} align="center">
            <ScanLine size={16} color={palette.info.text} strokeWidth={2} />
            <Text
              variant="body-sm"
              style={{ color: palette.info.text, flex: 1 }}
            >
              {scanNote}
            </Text>
          </HStack>
        </View>
      )}
      {done && (
        <View style={okBox}>
          <HStack gap={8} align="center">
            <PackageCheck
              size={18}
              color={palette.success.text}
              strokeWidth={2}
            />
            <Text variant="body-sm" tone="success">
              Stock received — {done} posted to inventory.
            </Text>
          </HStack>
        </View>
      )}
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
            label="Supplier (optional)"
            placeholder="Select supplier"
            value={supplierId}
            options={supplierOptions}
            onChange={setSupplierId}
            onCreate={
              canManageSuppliers
                ? async (label) => {
                    const s = await createSupplier.mutateAsync({ name: label });
                    return { value: s.id, label: s.name };
                  }
                : undefined
            }
            allowClear
          />
          <TextField
            label="Reference / PO no."
            value={referenceNo}
            onChangeText={setReference}
            placeholder="PO-1234"
          />
        </VStack>
      </Card>

      <VStack gap={10}>
        {lines.map((line, i) => {
          const isOpen = expanded.has(i);
          const product = line.productId ? productsById[line.productId] : null;
          const status = lineStatus(line);
          return (
            <Card key={i} elevation="base" style={{ padding: 0 }}>
              {/* Compact row — the whole point: 25 of these fit on one screen. */}
              <Pressable
                onPress={() => toggleExpanded(i)}
                style={styles.rowHead}
              >
                {isOpen ? (
                  <ChevronDown
                    size={17}
                    color={palette.text.tertiary}
                    strokeWidth={2}
                  />
                ) : (
                  <ChevronRight
                    size={17}
                    color={palette.text.tertiary}
                    strokeWidth={2}
                  />
                )}
                <VStack gap={2} flex={1}>
                  <Text
                    variant="label-lg"
                    tone={product ? "primary" : "tertiary"}
                    numberOfLines={1}
                  >
                    {i + 1}. {product ? product.name : "Choose a product"}
                  </Text>
                  <Text variant="caption" tone="tertiary" numberOfLines={1}>
                    {summaryLine(line, product)}
                  </Text>
                </VStack>
                <View style={[styles.pill, pillTone(status.tone)]}>
                  <Text
                    variant="label-sm"
                    style={{ color: pillTextColor(status.tone) }}
                  >
                    {status.label}
                  </Text>
                </View>
                {lines.length > 1 && (
                  <Pressable
                    onPress={() => removeLine(i)}
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <X size={15} color={palette.danger.text} strokeWidth={2} />
                  </Pressable>
                )}
              </Pressable>

              {isOpen && (
                <VStack gap={14} style={styles.rowBody}>
                  <Select
                    label="Product"
                    placeholder="Search by name or SKU…"
                    value={line.productId}
                    options={productOptions}
                    selectedLabel={
                      product ? `${product.name} · ${product.sku}` : undefined
                    }
                    onSearch={setProductQuery}
                    loading={productsLoading}
                    onChange={(v) => pickProduct(i, v)}
                  />

                  <HStack gap={12}>
                    <View style={{ flex: 1.2 }}>
                      <TextField
                        label="Batch no."
                        value={line.batchNumber}
                        onChangeText={(v) => setLine(i, { batchNumber: v })}
                        placeholder="B-001"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Quantity"
                        value={line.quantity}
                        onChangeText={(v) => setLine(i, { quantity: v })}
                        keyboardType="decimal-pad"
                        placeholder="0"
                      />
                    </View>
                  </HStack>

                  <Select
                    label="Unit"
                    placeholder="Unit"
                    value={line.unit}
                    options={unitOptions(line.productId)}
                    onChange={(v) => setLine(i, { unit: v })}
                  />

                  <HStack gap={12}>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Mfg date"
                        value={line.mfgDate}
                        onChangeText={(v) => setLine(i, { mfgDate: v })}
                        placeholder="YYYY-MM-DD"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Expiry date"
                        value={line.expiryDate}
                        onChangeText={(v) => setLine(i, { expiryDate: v })}
                        placeholder="YYYY-MM-DD"
                        autoCapitalize="none"
                      />
                    </View>
                  </HStack>

                  <HStack gap={12}>
                    <View style={{ flex: 1 }}>
                      <TextField
                        label="Cost / base unit (₹)"
                        value={line.purchasePrice}
                        onChangeText={(v) => setLine(i, { purchasePrice: v })}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>
                    <View style={{ flex: 1.4 }}>
                      <Select
                        label="Storage location"
                        placeholder="Where?"
                        value={line.locationId}
                        options={locationOptions}
                        onChange={(v) => setLine(i, { locationId: v })}
                      />
                    </View>
                  </HStack>

                  {line.productId && Number(line.quantity) > 0 && (
                    <Text variant="caption" tone="tertiary">
                      = {baseQty(line)} {product?.baseUnit} in base units
                    </Text>
                  )}
                </VStack>
              )}
            </Card>
          );
        })}
      </VStack>

      <Pressable onPress={addLine} style={styles.addRow}>
        <Plus size={18} color={palette.teal[600]} strokeWidth={2.2} />
        <Text variant="label" tone="accent">
          Add another line
        </Text>
      </Pressable>

      <Card style={{ marginTop: 8, marginBottom: 16 }}>
        <HStack align="center" justify="space-between">
          <Text variant="label-lg" tone="primary">
            Total to receive
          </Text>
          <Text variant="h3" tone="accent">
            {totalBase} units
          </Text>
        </HStack>
      </Card>

      <Button
        label="Receive stock"
        size="lg"
        loading={mut.isPending}
        disabled={!validLines.length}
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: palette.border.subtle,
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: palette.danger.bg,
    alignItems: "center",
    justifyContent: "center",
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
const okBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.success.bg,
  borderWidth: 1,
  borderColor: palette.success.border,
  marginBottom: 16,
} as const;
const infoBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.info.bg,
  borderWidth: 1,
  borderColor: palette.info.border,
  marginBottom: 16,
} as const;
const warnBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.warning.bg,
  borderWidth: 1,
  borderColor: palette.warning.border,
  marginBottom: 16,
} as const;
