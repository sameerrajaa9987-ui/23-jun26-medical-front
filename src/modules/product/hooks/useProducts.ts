import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  productApi,
  categoryApi,
  brandApi,
} from "@modules/product/api/productApi";
import { ProductPayload } from "@modules/product/types";

export const useProducts = (params?: {
  search?: string;
  categoryId?: string;
}) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () => productApi.list(params),
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.get(id),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => productApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
};

export const useUpdateProduct = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => productApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
};

export const useRemoveProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
};

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => categoryApi.list() });

export const useBrands = () =>
  useQuery({ queryKey: ["brands"], queryFn: () => brandApi.list() });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoryApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useCreateBrand = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => brandApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
};
