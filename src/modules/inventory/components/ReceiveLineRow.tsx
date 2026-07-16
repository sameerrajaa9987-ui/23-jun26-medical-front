import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { X, ChevronDown, ChevronRight } from "lucide-react-native";
import { DraftLine, ProductLite } from "@modules/inventory/types";
import {
  baseQty,
  lineStatus,
  summaryLine,
  unitOptions,
  LineTone,
} from "@modules/inventory/receiveDraft";
import { palette, radius } from "@shared/designSystem";
import { Text, VStack, HStack, Card, TextField, Select } from "@shared/ui";

interface Props {
  index: number;
  line: DraftLine;
  product: ProductLite | null;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<DraftLine>) => void;
  onPickProduct: (id: string | null) => void;
  onRemove?: () => void;
  productOptions: { value: string; label: string }[];
  onSearchProducts: (q: string) => void;
  productsLoading?: boolean;
  locationOptions: { value: string; label: string }[];
}

/**
 * One goods-received line: a compact row that opens into the full form.
 *
 * Collapsed by default so a 25-line scanned bill is readable at a glance — the
 * row states what's still missing (product / batch / qty / location) so gaps are
 * spotted without opening every form.
 */
export function ReceiveLineRow({
  index,
  line,
  product,
  open,
  onToggle,
  onChange,
  onPickProduct,
  onRemove,
  productOptions,
  onSearchProducts,
  productsLoading,
  locationOptions,
}: Props) {
  const status = lineStatus(line);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <Card elevation="base" style={{ padding: 0 }}>
      <Pressable onPress={onToggle} style={styles.head}>
        <Chevron size={17} color={palette.text.tertiary} strokeWidth={2} />
        <VStack gap={2} flex={1}>
          <Text
            variant="label-lg"
            tone={product ? "primary" : "tertiary"}
            numberOfLines={1}
          >
            {index + 1}. {product ? product.name : "Choose a product"}
          </Text>
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {summaryLine(line, product)}
          </Text>
        </VStack>
        <View style={[styles.pill, toneBg(status.tone)]}>
          <Text variant="label-sm" style={{ color: toneText(status.tone) }}>
            {status.label}
          </Text>
        </View>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
            <X size={15} color={palette.danger.text} strokeWidth={2} />
          </Pressable>
        )}
      </Pressable>

      {open && (
        <VStack gap={14} style={styles.body}>
          <Select
            label="Product"
            placeholder="Search by name or SKU…"
            value={line.productId}
            options={productOptions}
            selectedLabel={
              product ? `${product.name} · ${product.sku}` : undefined
            }
            onSearch={onSearchProducts}
            loading={productsLoading}
            onChange={onPickProduct}
          />

          <HStack gap={12}>
            <View style={{ flex: 1.2 }}>
              <TextField
                label="Batch no."
                value={line.batchNumber}
                onChangeText={(v) => onChange({ batchNumber: v })}
                placeholder="B-001"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Quantity"
                value={line.quantity}
                onChangeText={(v) => onChange({ quantity: v })}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          </HStack>

          <Select
            label="Unit"
            placeholder="Unit"
            value={line.unit}
            options={unitOptions(product)}
            onChange={(v) => onChange({ unit: v })}
          />

          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Mfg date"
                value={line.mfgDate}
                onChangeText={(v) => onChange({ mfgDate: v })}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Expiry date"
                value={line.expiryDate}
                onChangeText={(v) => onChange({ expiryDate: v })}
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
                onChangeText={(v) => onChange({ purchasePrice: v })}
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
                onChange={(v) => onChange({ locationId: v })}
              />
            </View>
          </HStack>

          {product && Number(line.quantity) > 0 && (
            <Text variant="caption" tone="tertiary">
              = {baseQty(line, product)} {product.baseUnit} in base units
            </Text>
          )}
        </VStack>
      )}
    </Card>
  );
}

const toneBg = (t: LineTone) =>
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

const toneText = (t: LineTone) =>
  t === "ok"
    ? palette.success.text
    : t === "warn"
      ? palette.warning.text
      : palette.text.tertiary;

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  body: {
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
  remove: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: palette.danger.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
