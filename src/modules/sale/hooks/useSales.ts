import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleApi } from "@modules/sale/api/saleApi";
import { CreateSalePayload, CreateReturnPayload } from "@modules/sale/types";

export const useSales = (params?: {
  search?: string;
  customerId?: string;
  status?: string;
}) =>
  useQuery({
    queryKey: ["sales", params],
    queryFn: () => saleApi.list(params),
  });

export const useSale = (id: string) =>
  useQuery({
    queryKey: ["sale", id],
    queryFn: () => saleApi.get(id),
    enabled: !!id,
  });

export const useInvoiceProfile = () =>
  useQuery({
    queryKey: ["invoice-profile"],
    queryFn: () => saleApi.invoiceProfile(),
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["sales"] });
  qc.invalidateQueries({ queryKey: ["stock"] });
  qc.invalidateQueries({ queryKey: ["stock-value"] });
  qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
};

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => saleApi.create(payload),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCreateReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnPayload) => saleApi.createReturn(payload),
    onSuccess: (_d, vars) => {
      invalidateAll(qc);
      qc.invalidateQueries({ queryKey: ["sale", vars.saleId] });
    },
  });
};
