import { apiClient } from "@api/apiClient";
import {
  StockSummaryItem,
  StockValue,
  ProductInventory,
  ReceivePayload,
  ReceiptDetail,
  ReceiptListItem,
  SearchResult,
  Paginated,
} from "@modules/inventory/types";

export const inventoryApi = {
  stock: async (params?: { search?: string; lowStockOnly?: boolean }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: StockSummaryItem[];
    }>("/inventory/stock", { params });
    return res.data.data;
  },
  value: async () => {
    const res = await apiClient.get<{ success: boolean; data: StockValue }>(
      "/inventory/value",
    );
    return res.data.data;
  },
  productInventory: async (productId: string) => {
    const res = await apiClient.get<{
      success: boolean;
      data: ProductInventory;
    }>(`/inventory/products/${productId}`);
    return res.data.data;
  },
  search: async (params: { q?: string; expiringInDays?: number }) => {
    const res = await apiClient.get<{ success: boolean; data: SearchResult }>(
      "/inventory/search",
      {
        params,
      },
    );
    return res.data.data;
  },
  receive: async (payload: ReceivePayload) => {
    const res = await apiClient.post<{ success: boolean; data: ReceiptDetail }>(
      "/inventory/receipts",
      payload,
    );
    return res.data.data;
  },
  receipts: async (params?: { search?: string }) => {
    const res = await apiClient.get<Paginated<ReceiptListItem>>(
      "/inventory/receipts",
      { params },
    );
    return res.data;
  },
  receipt: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: ReceiptDetail }>(
      `/inventory/receipts/${id}`,
    );
    return res.data.data;
  },
};
