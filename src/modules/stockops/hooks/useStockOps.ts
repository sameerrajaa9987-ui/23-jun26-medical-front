import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockOpsApi } from "@modules/stockops/api/stockOpsApi";
import { AdjustmentPayload, TransferPayload } from "@modules/stockops/types";

const invalidateStock = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["stock"] });
  qc.invalidateQueries({ queryKey: ["stock-value"] });
  qc.invalidateQueries({ queryKey: ["product-inventory"] });
  qc.invalidateQueries({ queryKey: ["expiry-report"] });
  qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
};

export const useAdjustments = (params?: { type?: string }) =>
  useQuery({
    queryKey: ["adjustments", params],
    queryFn: () => stockOpsApi.listAdjustments(params),
  });

export const useCreateAdjustment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustmentPayload) =>
      stockOpsApi.createAdjustment(payload),
    onSuccess: () => {
      invalidateStock(qc);
      qc.invalidateQueries({ queryKey: ["adjustments"] });
    },
  });
};

export const useTransfers = (params?: { search?: string }) =>
  useQuery({
    queryKey: ["transfers", params],
    queryFn: () => stockOpsApi.listTransfers(params),
  });

export const useCreateTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferPayload) =>
      stockOpsApi.createTransfer(payload),
    onSuccess: () => {
      invalidateStock(qc);
      qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
};
