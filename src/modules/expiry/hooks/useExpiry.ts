import { useQuery } from "@tanstack/react-query";
import { expiryApi } from "@modules/expiry/api/expiryApi";

export const useExpiryReport = () =>
  useQuery({ queryKey: ["expiry-report"], queryFn: () => expiryApi.report() });
