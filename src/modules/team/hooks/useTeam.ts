import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@modules/team/api/teamApi";
import { CreateUserPayload } from "@modules/team/types";

export const useTeamUsers = (params?: { search?: string; role?: string }) =>
  useQuery({
    queryKey: ["team-users", params],
    queryFn: () => teamApi.list(params),
  });

export const useTeamUser = (id: string) =>
  useQuery({
    queryKey: ["team-user", id],
    queryFn: () => teamApi.get(id),
    enabled: !!id,
  });

export const usePermissionCatalogue = () =>
  useQuery({
    queryKey: ["permission-catalogue"],
    queryFn: () => teamApi.permissionCatalogue(),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => teamApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
};

export const useUpdatePermissions = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { roleLabel?: string; permissions?: string[] }) =>
      teamApi.updatePermissions(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-users"] });
      qc.invalidateQueries({ queryKey: ["team-user", id] });
    },
  });
};

export const useSetActive = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) => teamApi.setActive(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-users"] });
      qc.invalidateQueries({ queryKey: ["team-user", id] });
    },
  });
};

export const useResetUserPassword = (id: string) =>
  useMutation({
    mutationFn: (newPassword: string) => teamApi.resetPassword(id, newPassword),
  });

export const useRemoveUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-users"] }),
  });
};

export const useAuditLogs = (params?: { search?: string; action?: string }) =>
  useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => teamApi.auditLogs(params),
  });
