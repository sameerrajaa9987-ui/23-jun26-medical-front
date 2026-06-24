import { apiClient } from "@api/apiClient";
import { Settings, SettingsPatch } from "@modules/settings/types";

export const settingsApi = {
  get: async () => {
    const res = await apiClient.get<{ success: boolean; data: Settings }>(
      "/settings",
    );
    return res.data.data;
  },
  update: async (patch: SettingsPatch) => {
    const res = await apiClient.patch<{ success: boolean; data: Settings }>(
      "/settings",
      patch,
    );
    return res.data.data;
  },
};
