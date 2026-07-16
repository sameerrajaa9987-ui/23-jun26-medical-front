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
} from "lucide-react-native";
import { useProducts } from "@modules/product/hooks/useProducts";
import { useAllLocations } from "@modules/warehouse/hooks/useWarehouse";
import {
  useSuppliers,
  useCreateSupplier,
} from "@modules/supplier/hooks/useSuppliers";
import { useReceiveStock } from "@modules/inventory/hooks/useInventory";
import {
  ReceiptLineInput,
  ScannedBill,
  OcrProductRef,
} from "@modules/inventory/types";
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
  // The picker needs the whole catalogue, not just page 1 — otherwise a product
  // that exists (and that the bill scanner matched) can't be selected here.
  const { data: products } = useProducts({ limit: 200 });
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
   * Products the bill scanner matched. The scanner searches the whole catalogue
   * server-side, so it can return a product that isn't on the page we loaded —
   * keeping them here means the picker can still resolve and display it however
   * large the catalogue grows.
   */
  const [scanProducts, setScanProducts] = useState<
    Record<string, OcrProductRef>
  >({});

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
    const matched: Record<string, OcrProductRef> = {};
    scanned.lines.forEach((l) => {
      if (l.match) matched[l.match.id] = l.match;
    });
    setScanProducts(matched);
    setLines(linesFromScan(scanned));
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

  /** Catalogue page + any product the scanner matched (which may not be on it). */
  const productsById = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        sku: string;
        baseUnit: string;
        packs: { unit: string; factor: number }[];
      }
    > = {};
    for (const p of products?.data || []) {
      map[p.id] = {
        id: p.id,
        name: p.name,
        sku: p.sku,
        baseUnit: p.baseUnit,
        packs: p.packs || [],
      };
    }
    for (const [id, p] of Object.entries(scanProducts)) {
      if (!map[id]) {
        map[id] = {
          id: p.id,
          name: p.name,
          sku: p.sku,
          baseUnit: p.baseUnit,
          packs: p.packs || [],
        };
      }
    }
    return map;
  }, [products, scanProducts]);

  const productOptions = useMemo(
    () =>
      Object.values(productsById).map((p) => ({
        value: p.id,
        label: `${p.name} · ${p.sku}`,
      })),
    [productsById],
  );
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
  const addLine = () => setLines((cur) => [...cur, emptyLine()]);
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

      <VStack gap={14}>
        {lines.map((line, i) => (
          <Card key={i} elevation="base">
            <VStack gap={14}>
              <HStack align="center" justify="space-between">
                <HStack gap={8} align="center">
                  <Text variant="label-lg" tone="primary">
                    Line {i + 1}
                  </Text>
                  {line.flagged && (
                    <HStack gap={4} align="center">
                      <AlertTriangle
                        size={13}
                        color={palette.warning.text}
                        strokeWidth={2.2}
                      />
                      <Text variant="label-sm" tone="warning">
                        check this
                      </Text>
                    </HStack>
                  )}
                </HStack>
                {lines.length > 1 && (
                  <Pressable
                    onPress={() => removeLine(i)}
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <X size={16} color={palette.danger.text} strokeWidth={2} />
                  </Pressable>
                )}
              </HStack>

              <Select
                label="Product"
                placeholder="Select product"
                value={line.productId}
                options={productOptions}
                onChange={(v) => {
                  const p = v ? productsById[v] : null;
                  setLine(i, { productId: v, unit: p?.baseUnit || null });
                }}
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
                  = {baseQty(line)} {productsById[line.productId]?.baseUnit} in
                  base units
                </Text>
              )}
            </VStack>
          </Card>
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
  removeBtn: {
    width: 32,
    height: 32,
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
