import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supplierApi } from "@modules/supplier/api/supplierApi";
import { SupplierPayload } from "@modules/supplier/types";

export const useSuppliers = (params?: { search?: string }) =>
  useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => supplierApi.list(params),
  });

export const useSupplier = (id: string) =>
  useQuery({
    queryKey: ["supplier", id],
    queryFn: () => supplierApi.get(id),
    enabled: !!id,
  });

export const useSupplierPurchases = (id: string) =>
  useQuery({
    queryKey: ["supplier-purchases", id],
    queryFn: () => supplierApi.purchases(id),
    enabled: !!id,
  });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupplierPayload) => supplierApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};

export const useUpdateSupplier = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SupplierPayload> & { isActive?: boolean }) =>
      supplierApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["supplier", id] });
    },
  });
};

export const useRemoveSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supplierApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};
