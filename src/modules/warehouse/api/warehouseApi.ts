import { apiClient } from "@api/apiClient";
import {
  LocationNode,
  LocationTreeNode,
  CreateLocationPayload,
} from "@modules/warehouse/types";

export const warehouseApi = {
  warehouses: async () => {
    const res = await apiClient.get<{ success: boolean; data: LocationNode[] }>(
      "/locations/warehouses",
    );
    return res.data.data;
  },
  allLocations: async () => {
    const res = await apiClient.get<{ success: boolean; data: LocationNode[] }>(
      "/locations",
    );
    return res.data.data;
  },
  tree: async (warehouseId?: string) => {
    const res = await apiClient.get<{
      success: boolean;
      data: LocationTreeNode[];
    }>("/locations/tree", {
      params: warehouseId ? { warehouseId } : undefined,
    });
    return res.data.data;
  },
  create: async (payload: CreateLocationPayload) => {
    const res = await apiClient.post<{ success: boolean; data: LocationNode }>(
      "/locations",
      payload,
    );
    return res.data.data;
  },
  rename: async (id: string, name: string) => {
    const res = await apiClient.patch<{ success: boolean; data: LocationNode }>(
      `/locations/${id}`,
      { name },
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/locations/${id}`);
    return res.data;
  },
};
