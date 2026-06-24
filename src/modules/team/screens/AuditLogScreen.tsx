import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Search, ScrollText } from "lucide-react-native";
import { useAuditLogs } from "@modules/team/hooks/useTeam";
import { ActivityLog } from "@modules/team/types";
import { palette, radius, outline } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  StatusChip,
  EmptyState,
} from "@shared/ui";

const ACTION_TONE = (
  action: string,
): "success" | "warning" | "danger" | "info" | "neutral" => {
  if (action.includes("login") || action.includes("signup")) return "info";
  if (action.includes("remove") || action.includes("delete")) return "danger";
  if (action.includes("create")) return "success";
  if (
    action.includes("update") ||
    action.includes("set_active") ||
    action.includes("reset")
  )
    return "warning";
  return "neutral";
};

export default function AuditLogScreen() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isRefetching } = useAuditLogs(
    search.trim() ? { search: search.trim() } : undefined,
  );
  const logs = data?.data ?? [];

  return (
    <Screen
      overline="Compliance"
      title="Audit Logs"
      subtitle={`${data?.meta?.total ?? 0} entries · append-only, tamper-proof`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search actions, users or descriptions"
          placeholderTextColor={palette.text.tertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={isLoading ? "Loading…" : "No activity yet"}
          message="Every sign-in and change will appear here."
        />
      ) : (
        <VStack gap={10} style={{ marginTop: 16 }}>
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </VStack>
      )}
    </Screen>
  );
}

function LogRow({ log }: { log: ActivityLog }) {
  return (
    <Card elevation="base">
      <VStack gap={8}>
        <HStack align="center" justify="space-between" gap={8}>
          <StatusChip label={log.action} tone={ACTION_TONE(log.action)} />
          <Text variant="caption" tone="tertiary">
            {formatWhen(log.createdAt)}
          </Text>
        </HStack>
        <Text variant="body-sm" tone="secondary">
          {log.description || `${log.entityType} ${log.action}`}
        </Text>
        <HStack gap={8} align="center" wrap>
          <Text variant="caption" tone="tertiary">
            {log.userName || "System"}
          </Text>
          {log.userRole ? (
            <Text variant="caption" tone="tertiary">
              · {log.userRole}
            </Text>
          ) : null}
          {log.ipAddress ? (
            <Text variant="caption" tone="tertiary">
              · {log.ipAddress}
            </Text>
          ) : null}
        </HStack>
      </VStack>
    </Card>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: radius.md,
    borderWidth: outline.width,
    borderColor: outline.color,
    backgroundColor: palette.surface.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: palette.text.primary,
    paddingVertical: 0,
  },
});
