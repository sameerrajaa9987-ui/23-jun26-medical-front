import { apiClient } from "@api/apiClient";

export interface ExpiryBatch {
  batchId: string;
  productId: string;
  productName: string;
  sku: string;
  baseUnit: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  onHand: number;
  locations: { code: string; quantity: number }[];
  stockValue: number;
  daysToExpiry: number;
  expired: boolean;
}

export interface ExpiryReport {
  thresholds: number[];
  summary: {
    expired: number;
    expiringSoon: number;
    total: number;
    valueAtRisk: number;
  };
  expired: ExpiryBatch[];
  buckets: { days: number; count: number; items: ExpiryBatch[] }[];
}

export const expiryApi = {
  report: async () => {
    const res = await apiClient.get<{ success: boolean; data: ExpiryReport }>(
      "/expiry",
    );
    return res.data.data;
  },
};
