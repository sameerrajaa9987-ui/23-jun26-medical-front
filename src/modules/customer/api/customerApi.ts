import { apiClient } from "@api/apiClient";
import { Customer, CustomerPayload, Paginated } from "@modules/customer/types";

export const customerApi = {
  list: async (params?: { search?: string }) => {
    const res = await apiClient.get<Paginated<Customer>>("/customers", {
      params,
    });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Customer }>(
      `/customers/${id}`,
    );
    return res.data.data;
  },
  create: async (payload: CustomerPayload) => {
    const res = await apiClient.post<{ success: boolean; data: Customer }>(
      "/customers",
      payload,
    );
    return res.data.data;
  },
  update: async (
    id: string,
    payload: Partial<CustomerPayload> & { isActive?: boolean },
  ) => {
    const res = await apiClient.patch<{ success: boolean; data: Customer }>(
      `/customers/${id}`,
      payload,
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/customers/${id}`);
    return res.data;
  },
};
