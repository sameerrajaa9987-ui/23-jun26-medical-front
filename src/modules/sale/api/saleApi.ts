import { apiClient } from "@api/apiClient";
import {
  Sale,
  SaleListItem,
  CreateSalePayload,
  CreateReturnPayload,
  ReturnDoc,
  InvoiceProfile,
  Paginated,
} from "@modules/sale/types";

export const saleApi = {
  list: async (params?: {
    search?: string;
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<Paginated<SaleListItem>>("/sales", {
      params,
    });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Sale }>(
      `/sales/${id}`,
    );
    return res.data.data;
  },
  create: async (payload: CreateSalePayload) => {
    const res = await apiClient.post<{ success: boolean; data: Sale }>(
      "/sales",
      payload,
    );
    return res.data.data;
  },
  createReturn: async (payload: CreateReturnPayload) => {
    const res = await apiClient.post<{ success: boolean; data: ReturnDoc }>(
      "/sales/returns",
      payload,
    );
    return res.data.data;
  },
  invoiceProfile: async () => {
    const res = await apiClient.get<{ success: boolean; data: InvoiceProfile }>(
      "/settings/invoice-profile",
    );
    return res.data.data;
  },
};
