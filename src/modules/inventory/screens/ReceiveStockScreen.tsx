import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Plus, X, History, PackageCheck } from "lucide-react-native";
import { useProducts } from "@modules/product/hooks/useProducts";
import { useAllLocations } from "@modules/warehouse/hooks/useWarehouse";
import {
  useSuppliers,
  useCreateSupplier,
} from "@modules/supplier/hooks/useSuppliers";
import { useReceiveStock } from "@modules/inventory/hooks/useInventory";
import { ReceiptLineInput } from "@modules/inventory/types";
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

export default function ReceiveStockScreen() {
  const navigation = useNavigation<any>();
  const { data: products } = useProducts();
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

  const supplierOptions = (suppliers?.data || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const productsById = useMemo(
    () => Object.fromEntries((products?.data || []).map((p) => [p.id, p])),
    [products],
  );
  const productOptions = (products?.data || []).map((p) => ({
    value: p.id,
    label: `${p.name} · ${p.sku}`,
  }));
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
        <Button
          label="History"
          variant="secondary"
          fullWidth={false}
          icon={
            <History size={16} color={palette.text.primary} strokeWidth={2} />
          }
          onPress={() => navigation.navigate("Receipts")}
        />
      }
    >
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
                <Text variant="label-lg" tone="primary">
                  Line {i + 1}
                </Text>
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
