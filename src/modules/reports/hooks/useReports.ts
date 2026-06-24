import { useMutation, useQuery } from "@tanstack/react-query";
import { reportsApi, ReportType } from "@modules/reports/api/reportsApi";

export const useReport = (
  type: ReportType,
  params: { from?: string; to?: string },
) =>
  useQuery({
    queryKey: ["report", type, params],
    queryFn: () => reportsApi.get(type, params),
  });

export const useDownloadReport = () =>
  useMutation({
    mutationFn: ({
      type,
      format,
      params,
    }: {
      type: ReportType;
      format: "excel" | "pdf";
      params: { from?: string; to?: string };
    }) => reportsApi.download(type, format, params),
  });
