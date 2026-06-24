import React, { useState } from "react";
import { View, Pressable, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Search,
  Plus,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { useTeamUsers } from "@modules/team/hooks/useTeam";
import { TeamUser } from "@modules/team/types";
import { palette, radius, outline } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Avatar,
  StatusChip,
  Button,
  EmptyState,
} from "@shared/ui";

export default function TeamScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch, isRefetching } = useTeamUsers(
    search.trim() ? { search: search.trim() } : undefined,
  );
  const users = data?.data ?? [];

  return (
    <Screen
      overline="Administration"
      title="Team & Access"
      subtitle={`${data?.meta?.total ?? 0} members · permission-based access`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        <Button
          label="Add member"
          fullWidth={false}
          icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.2} />}
          onPress={() => navigation.navigate("AddUser")}
        />
      }
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search name, email or role"
          placeholderTextColor={palette.text.tertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isLoading ? "Loading team…" : "No members yet"}
          message="Add staff and assign exactly the permissions they need."
        />
      ) : (
        <VStack gap={12} style={{ marginTop: 16 }}>
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              onPress={() => navigation.navigate("UserDetail", { id: u.id })}
            />
          ))}
        </VStack>
      )}
    </Screen>
  );
}

function UserRow({ user, onPress }: { user: TeamUser; onPress: () => void }) {
  const isAdmin = user.role === "admin";
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <Avatar
          name={user.fullName}
          size={46}
          tone={isAdmin ? "cobalt" : "teal"}
        />
        <VStack gap={4} flex={1}>
          <HStack gap={8} align="center">
            <Text variant="label-lg" tone="primary" numberOfLines={1}>
              {user.fullName}
            </Text>
            {isAdmin && (
              <ShieldCheck
                size={15}
                color={palette.cobalt[600]}
                strokeWidth={2}
              />
            )}
          </HStack>
          <Text variant="body-sm" tone="tertiary" numberOfLines={1}>
            {user.email}
          </Text>
          <HStack gap={6} wrap>
            <StatusChip
              label={isAdmin ? "Admin" : user.roleLabel || "Staff"}
              tone={isAdmin ? "info" : "neutral"}
            />
            {!isAdmin && (
              <StatusChip
                label={`${user.permissions.length} permissions`}
                tone="neutral"
              />
            )}
            {!user.isActive && <StatusChip label="Disabled" tone="danger" />}
          </HStack>
        </VStack>
        <ChevronRight size={18} color={palette.text.tertiary} strokeWidth={2} />
      </HStack>
    </Card>
  );
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
