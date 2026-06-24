export type AdjustmentType = "damaged" | "lost" | "expired" | "correction";

export interface Adjustment {
  id: string;
  adjustmentNo: string;
  type: AdjustmentType;
  direction: "in" | "out";
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  locationCode: string;
  quantity: number;
  reason: string;
  valueImpact: number;
  createdByName: string;
  createdAt: string;
}

export interface AdjustmentPayload {
  type: AdjustmentType;
  direction?: "in" | "out";
  productId: string;
  batchId: string;
  locationId: string;
  quantity: number;
  reason?: string;
}

export interface Transfer {
  id: string;
  transferNo: string;
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  fromLocationCode: string;
  toLocationCode: string;
  quantity: number;
  note: string;
  createdByName: string;
  createdAt: string;
}

export interface TransferPayload {
  productId: string;
  batchId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  note?: string;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}
