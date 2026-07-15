import { apiClient } from "@api/apiClient";
import {
  Supplier,
  SupplierPayload,
  SupplierPurchase,
  Paginated,
} from "@modules/supplier/types";

export const supplierApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<Paginated<Supplier>>("/suppliers", {
      params,
    });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Supplier }>(
      `/suppliers/${id}`,
    );
    return res.data.data;
  },
  purchases: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      data: SupplierPurchase[];
    }>(`/suppliers/${id}/purchases`);
    return res.data.data;
  },
  create: async (payload: SupplierPayload) => {
    const res = await apiClient.post<{ success: boolean; data: Supplier }>(
      "/suppliers",
      payload,
    );
    return res.data.data;
  },
  update: async (
    id: string,
    payload: Partial<SupplierPayload> & { isActive?: boolean },
  ) => {
    const res = await apiClient.patch<{ success: boolean; data: Supplier }>(
      `/suppliers/${id}`,
      payload,
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/suppliers/${id}`);
    return res.data;
  },
};
