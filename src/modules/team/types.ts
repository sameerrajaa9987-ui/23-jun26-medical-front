export interface TeamUser {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: "admin" | "staff";
  roleLabel: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
  roleLabel?: string;
  permissions?: string[];
}

export interface PermissionCatalogue {
  permissions: string[];
  suggestedLabels: string[];
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}
