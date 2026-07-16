import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Plus,
  History,
  PackageCheck,
  ScanLine,
  AlertTriangle,
} from "lucide-react-native";
import { useProducts } from "@modules/product/hooks/useProducts";
import { useAllLocations } from "@modules/warehouse/hooks/useWarehouse";
import {
  useSuppliers,
  useCreateSupplier,
} from "@modules/supplier/hooks/useSuppliers";
import { useReceiveStock } from "@modules/inventory/hooks/useInventory";
import { ReceiveLineRow } from "@modules/inventory/components/ReceiveLineRow";
import { DraftLine, ProductLite, ScannedBill } from "@modules/inventory/types";
import {
  emptyLine,
  linesFromScan,
  productsFromScan,
  scanSummary,
  duplicateWarning,
  toReceiptLines,
  totalBaseUnits,
} from "@modules/inventory/receiveDraft";
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

/**
 * Receive Stock — goods-received note.
 *
 * Orchestration only: state, data fetching and wiring. The draft rules live in
 * `receiveDraft.ts` and a line's UI in `components/ReceiveLineRow`.
 */
export default function ReceiveStockScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // The catalogue can run to tens of thousands of items, so it's never loaded
  // whole: the picker searches server-side and `knownProducts` caches whatever
  // we've already resolved (scan matches + past picks).
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
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [knownProducts, setKnownProducts] = useState<
    Record<string, ProductLite>
  >({});
  /** Open rows. Collapsed by default so a 25-line bill fits on one screen. */
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggleExpanded = (i: number) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // A scanned bill arrives as a route param — consume it once, then clear it so
  // a re-render can't wipe the pharmacist's edits.
  const scanned: ScannedBill | undefined = route.params?.scanned;
  /* eslint-disable react-hooks/set-state-in-effect -- one-shot route param:
     the scan result only exists once navigation delivers it. */
  useEffect(() => {
    if (!scanned) return;
    setKnownProducts((cur) => ({ ...cur, ...productsFromScan(scanned) }));
    setLines(linesFromScan(scanned));
    setExpanded(new Set()); // all collapsed — the point is to see them all
    setReference(scanned.invoiceNo || "");
    if (scanned.supplierMatch) setSupplierId(scanned.supplierMatch.id);
    setScanNote(scanSummary(scanned));
    setDupWarning(duplicateWarning(scanned));
    navigation.setParams({ scanned: undefined });
  }, [scanned, navigation]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const supplierOptions = (suppliers?.data || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const locationOptions = (locations || []).map((l) => ({
    value: l.id,
    label: `${l.code} — ${l.name}`,
  }));

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

  /** Cache first, topped up with the live results — resolves anything on the form. */
  const productsById = useMemo(() => {
    const map: Record<string, ProductLite> = { ...knownProducts };
    for (const p of searchResults) map[p.id] = p;
    return map;
  }, [searchResults, knownProducts]);

  /** The picker lists search results only — the catalogue is far too big to list. */
  const productOptions = useMemo(
    () =>
      searchResults.map((p) => ({
        value: p.id,
        label: `${p.name} · ${p.sku}`,
      })),
    [searchResults],
  );

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines((cur) =>
      cur.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );

  /** Remember every pick so its name/unit survives the next search. */
  const pickProduct = (i: number, id: string | null) => {
    const p = id ? productsById[id] : null;
    if (p) setKnownProducts((cur) => ({ ...cur, [p.id]: p }));
    setLine(i, { productId: id, unit: p?.baseUnit || null });
  };

  // A manually-added line is the one you want to fill in next.
  const addLine = () =>
    setLines((cur) => {
      setExpanded((e) => new Set(e).add(cur.length));
      return [...cur, emptyLine()];
    });

  const removeLine = (i: number) =>
    setLines((cur) =>
      cur.length === 1 ? cur : cur.filter((_, idx) => idx !== i),
    );

  const validLines = toReceiptLines(lines);
  const totalBase = totalBaseUnits(lines, productsById);

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
          setExpanded(new Set([0]));
          setSupplierId(null);
          setReference("");
          setScanNote(null);
          setDupWarning(null);
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
      {dupWarning && (
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
              {dupWarning}
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
        {lines.map((line, i) => (
          <ReceiveLineRow
            key={i}
            index={i}
            line={line}
            product={line.productId ? productsById[line.productId] : null}
            open={expanded.has(i)}
            onToggle={() => toggleExpanded(i)}
            onChange={(patch) => setLine(i, patch)}
            onPickProduct={(id) => pickProduct(i, id)}
            onRemove={lines.length > 1 ? () => removeLine(i) : undefined}
            productOptions={productOptions}
            onSearchProducts={setProductQuery}
            productsLoading={productsLoading}
            locationOptions={locationOptions}
          />
        ))}
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
