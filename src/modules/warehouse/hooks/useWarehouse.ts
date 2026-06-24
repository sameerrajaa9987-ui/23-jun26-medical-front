import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { warehouseApi } from "@modules/warehouse/api/warehouseApi";
import { CreateLocationPayload } from "@modules/warehouse/types";

export const useWarehouses = () =>
  useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehouseApi.warehouses(),
  });

export const useAllLocations = () =>
  useQuery({
    queryKey: ["all-locations"],
    queryFn: () => warehouseApi.allLocations(),
  });

export const useWarehouseTree = (warehouseId?: string) =>
  useQuery({
    queryKey: ["warehouse-tree", warehouseId || "all"],
    queryFn: () => warehouseApi.tree(warehouseId),
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["warehouse-tree"] });
  qc.invalidateQueries({ queryKey: ["warehouses"] });
  qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
};

export const useCreateLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) =>
      warehouseApi.create(payload),
    onSuccess: () => invalidate(qc),
  });
};

export const useRenameLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      warehouseApi.rename(id, name),
    onSuccess: () => invalidate(qc),
  });
};

export const useRemoveLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehouseApi.remove(id),
    onSuccess: () => invalidate(qc),
  });
};
