import { Platform } from "react-native";
// Legacy entrypoint keeps documentDirectory + downloadAsync (SDK 56 moved the
// default export to the new File API).
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { apiClient } from "@api/apiClient";
import { environment } from "@config/env";
import { useAuthStore } from "@shared/store/useAuthStore";

export type ReportType =
  | "inventory"
  | "sales"
  | "expiry"
  | "batch"
  | "stock-movement"
  | "warehouse"
  | "purchase"
  | "user-activity";

export interface ReportColumn {
  key: string;
  label: string;
  type?: "money" | "number" | "date";
}

export interface ReportData {
  type: ReportType;
  title: string;
  generatedAt: string;
  range: { from?: string; to?: string };
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  summary?: Record<string, number | string>;
}

export const reportsApi = {
  get: async (type: ReportType, params: { from?: string; to?: string }) => {
    const res = await apiClient.get<{ success: boolean; data: ReportData }>(
      `/reports/${type}`,
      { params },
    );
    return res.data.data;
  },

  /** Downloads the report file (xlsx/pdf) — browser download on web, share sheet on native. */
  download: async (
    type: ReportType,
    format: "excel" | "pdf",
    params: { from?: string; to?: string },
  ) => {
    const ext = format === "pdf" ? "pdf" : "xlsx";
    const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}.${ext}`;

    if (Platform.OS === "web") {
      const res = await apiClient.get(`/reports/${type}/export`, {
        params: { ...params, format },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const token = useAuthStore.getState().token;
    const qs = new URLSearchParams({ ...params, format } as Record<
      string,
      string
    >).toString();
    const uri = `${environment.apiUrl}/reports/${type}/export?${qs}`;
    const target =
      (FileSystem.documentDirectory || FileSystem.cacheDirectory) + filename;
    const dl = await FileSystem.downloadAsync(uri, target, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(dl.uri);
  },
};
