import React, { useEffect } from "react";
import { useProducts } from "@modules/product/hooks/useProducts";
import { useProductInventory } from "@modules/inventory/hooks/useInventory";
import { VStack, Select, Text } from "@shared/ui";

export interface CellSelection {
  productId: string | null;
  batchId: string | null;
  locationId: string | null;
  available: number;
  baseUnit: string;
  batchNumber: string;
  locationCode: string;
}

interface Props {
  value: CellSelection;
  onChange: (sel: CellSelection) => void;
  locationLabel?: string;
}

const EMPTY: Omit<CellSelection, "productId"> = {
  batchId: null,
  locationId: null,
  available: 0,
  baseUnit: "",
  batchNumber: "",
  locationCode: "",
};

/** Picks an exact in-stock cell: product → batch → location (with availability). */
export function StockCellPicker({
  value,
  onChange,
  locationLabel = "Location",
}: Props) {
  const { data: products } = useProducts();
  const { data: inv } = useProductInventory(value.productId || "");

  const productOptions = (products?.data || []).map((p) => ({
    value: p.id,
    label: `${p.name} · ${p.sku}`,
  }));
  const baseUnit = inv?.product.baseUnit || "";
  const batches = inv?.batches || [];
  const batchOptions = batches.map((b) => ({
    value: b.batchId,
    label: `${b.batchNumber}${b.expiryDate ? ` · exp ${b.expiryDate.slice(0, 10)}` : ""} · ${b.onHand} ${baseUnit}`,
  }));
  const selectedBatch = batches.find((b) => b.batchId === value.batchId);
  const locationOptions = (selectedBatch?.locations || []).map((l) => ({
    value: l.locationId,
    label: `${l.code} · ${l.quantity} ${baseUnit}`,
  }));
  const selectedLoc = selectedBatch?.locations.find(
    (l) => l.locationId === value.locationId,
  );

  // Keep derived fields (available/baseUnit/labels) in sync with the selection.
  useEffect(() => {
    const available = selectedLoc?.quantity ?? 0;
    if (
      value.available !== available ||
      value.baseUnit !== baseUnit ||
      value.batchNumber !== (selectedBatch?.batchNumber || "") ||
      value.locationCode !== (selectedLoc?.code || "")
    ) {
      onChange({
        ...value,
        available,
        baseUnit,
        batchNumber: selectedBatch?.batchNumber || "",
        locationCode: selectedLoc?.code || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    value.productId,
    value.batchId,
    value.locationId,
    baseUnit,
    selectedBatch,
    selectedLoc,
  ]);

  return (
    <VStack gap={16}>
      <Select
        label="Product"
        placeholder="Select product"
        value={value.productId}
        options={productOptions}
        onChange={(v) => onChange({ productId: v, ...EMPTY })}
      />
      <Select
        label="Batch"
        placeholder={value.productId ? "Select batch" : "Pick a product first"}
        value={value.batchId}
        options={batchOptions}
        onChange={(v) => onChange({ ...value, batchId: v, locationId: null })}
      />
      <Select
        label={locationLabel}
        placeholder={value.batchId ? "Select location" : "Pick a batch first"}
        value={value.locationId}
        options={locationOptions}
        onChange={(v) => onChange({ ...value, locationId: v })}
      />
      {value.locationId ? (
        <Text variant="caption" tone="tertiary">
          Available here: {value.available} {value.baseUnit}
        </Text>
      ) : null}
    </VStack>
  );
}

export const emptyCell = (): CellSelection => ({
  productId: null,
  batchId: null,
  locationId: null,
  available: 0,
  baseUnit: "",
  batchNumber: "",
  locationCode: "",
});
