import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderApi } from "@modules/reminder/api/reminderApi";
import { ReminderPayload, ReminderUpdate } from "@modules/reminder/types";

export const useReminders = (params?: { status?: string; search?: string }) =>
  useQuery({
    queryKey: ["reminders", params],
    queryFn: () => reminderApi.list(params),
  });

export const useReminderSummary = () =>
  useQuery({
    queryKey: ["reminder-summary"],
    queryFn: () => reminderApi.summary(),
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["reminders"] });
  qc.invalidateQueries({ queryKey: ["reminder-summary"] });
};

export const useCreateReminder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReminderPayload) => reminderApi.create(payload),
    onSuccess: () => invalidate(qc),
  });
};

export const useUpdateReminder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ReminderUpdate }) =>
      reminderApi.update(id, patch),
    onSuccess: () => invalidate(qc),
  });
};

export const useRemoveReminder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reminderApi.remove(id),
    onSuccess: () => invalidate(qc),
  });
};
