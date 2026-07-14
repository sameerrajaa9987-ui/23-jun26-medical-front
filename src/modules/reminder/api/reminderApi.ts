import { apiClient } from "@api/apiClient";
import {
  Reminder,
  ReminderPayload,
  ReminderUpdate,
  ReminderSummary,
  Paginated,
} from "@modules/reminder/types";

export const reminderApi = {
  list: async (params?: { status?: string; search?: string }) => {
    const res = await apiClient.get<Paginated<Reminder>>("/reminders", {
      params,
    });
    return res.data;
  },
  summary: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: ReminderSummary;
    }>("/reminders/summary");
    return res.data.data;
  },
  create: async (payload: ReminderPayload) => {
    const res = await apiClient.post<{ success: boolean; data: Reminder }>(
      "/reminders",
      payload,
    );
    return res.data.data;
  },
  update: async (id: string, payload: ReminderUpdate) => {
    const res = await apiClient.patch<{ success: boolean; data: Reminder }>(
      `/reminders/${id}`,
      payload,
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete(`/reminders/${id}`);
    return res.data;
  },
};
