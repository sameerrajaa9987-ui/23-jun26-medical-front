import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@modules/dashboard/api/dashboardApi";

export const useDashboardSummary = () =>
  useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardApi.summary(),
  });
