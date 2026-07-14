export type ReminderPriority = "low" | "normal" | "high";
export type ReminderStatus = "pending" | "done";

export interface Reminder {
  id: string;
  title: string;
  notes: string;
  dueAt: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  completedAt: string | null;
  isOverdue: boolean;
  createdAt: string;
}

export interface ReminderPayload {
  title: string;
  notes?: string;
  dueAt: string; // ISO string
  priority?: ReminderPriority;
}

export interface ReminderUpdate {
  title?: string;
  notes?: string;
  dueAt?: string;
  priority?: ReminderPriority;
  status?: ReminderStatus;
}

export interface ReminderSummary {
  pending: number;
  overdue: number;
  dueToday: number;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}
