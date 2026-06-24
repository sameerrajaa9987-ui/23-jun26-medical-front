import { apiClient } from "@api/apiClient";
import {
  Product,
  ProductListItem,
  ProductPayload,
  Category,
  Brand,
  Paginated,
} from "@modules/product/types";

export const productApi = {
  list: async (params?: {
    search?: string;
    categoryId?: string;
    brandId?: string;
  }) => {
    const res = await apiClient.get<Paginated<ProductListItem>>("/products", {
      params,
    });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Product }>(
      `/products/${id}`,
    );
    return res.data.data;
  },
  create: async (payload: ProductPayload) => {
    const res = await apiClient.post<{ success: boolean; data: Product }>(
      "/products",
      payload,
    );
    return res.data.data;
  },
  update: async (id: string, payload: ProductPayload) => {
    const res = await apiClient.patch<{ success: boolean; data: Product }>(
      `/products/${id}`,
      payload,
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },
};

export const categoryApi = {
  list: async () => {
    const res = await apiClient.get<Paginated<Category>>("/categories", {
      params: { limit: 200 },
    });
    return res.data.data;
  },
  create: async (name: string) => {
    const res = await apiClient.post<{ success: boolean; data: Category }>(
      "/categories",
      { name },
    );
    return res.data.data;
  },
  update: async (id: string, patch: { name?: string; isActive?: boolean }) => {
    const res = await apiClient.patch<{ success: boolean; data: Category }>(
      `/categories/${id}`,
      patch,
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },
};

export const brandApi = {
  list: async () => {
    const res = await apiClient.get<Paginated<Brand>>("/brands", {
      params: { limit: 200 },
    });
    return res.data.data;
  },
  create: async (name: string) => {
    const res = await apiClient.post<{ success: boolean; data: Brand }>(
      "/brands",
      { name },
    );
    return res.data.data;
  },
  update: async (id: string, patch: { name?: string; isActive?: boolean }) => {
    const res = await apiClient.patch<{ success: boolean; data: Brand }>(
      `/brands/${id}`,
      patch,
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/brands/${id}`);
    return res.data;
  },
};
