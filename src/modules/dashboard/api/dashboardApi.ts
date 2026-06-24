import { apiClient } from "@api/apiClient";
import { DashboardSummary } from "@modules/dashboard/types";

export const dashboardApi = {
  summary: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: DashboardSummary;
    }>("/dashboard/summary");
    return res.data.data;
  },
};
