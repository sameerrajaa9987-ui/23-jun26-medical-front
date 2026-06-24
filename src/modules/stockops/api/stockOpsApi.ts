import { apiClient } from "@api/apiClient";
import {
  Adjustment,
  AdjustmentPayload,
  Transfer,
  TransferPayload,
  Paginated,
} from "@modules/stockops/types";

export const stockOpsApi = {
  listAdjustments: async (params?: { type?: string }) => {
    const res = await apiClient.get<Paginated<Adjustment>>("/adjustments", {
      params,
    });
    return res.data;
  },
  createAdjustment: async (payload: AdjustmentPayload) => {
    const res = await apiClient.post<{ success: boolean; data: Adjustment }>(
      "/adjustments",
      payload,
    );
    return res.data.data;
  },
  listTransfers: async (params?: { search?: string }) => {
    const res = await apiClient.get<Paginated<Transfer>>("/transfers", {
      params,
    });
    return res.data;
  },
  createTransfer: async (payload: TransferPayload) => {
    const res = await apiClient.post<{ success: boolean; data: Transfer }>(
      "/transfers",
      payload,
    );
    return res.data.data;
  },
};
