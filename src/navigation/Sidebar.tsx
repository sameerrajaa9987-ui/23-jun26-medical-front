import React from "react";
import { View, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Activity, LogOut } from "lucide-react-native";
import { useAuthStore } from "@shared/store/useAuthStore";
import { palette, radius, layout } from "@shared/designSystem";
import { Text, VStack, HStack, Avatar } from "@shared/ui";
import { NAV_ITEMS, NavItem } from "./navItems";

interface Props {
  activeRoute: string;
  onNavigate: (name: string) => void;
}

export function Sidebar({ activeRoute, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const logout = useAuthStore((s) => s.logout);

  const items = NAV_ITEMS.filter((it) => {
    if (it.adminOnly) return isAdmin();
    if (it.permission) return hasPermission(it.permission);
    return true;
  });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 20 }]}>
      {/* Brand */}
      <HStack
        gap={10}
        align="center"
        style={{ paddingHorizontal: 20, marginBottom: 24 }}
      >
        <View style={styles.logo}>
          <Activity size={20} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <VStack gap={1} flex={1}>
          <Text variant="h4" tone="primary" numberOfLines={1}>
            MedStock
          </Text>
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {organization?.name || "Inventory"}
          </Text>
        </VStack>
      </HStack>

      {/* Nav */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {items.map((item) => (
          <NavRow
            key={item.name}
            item={item}
            active={activeRoute === item.name}
            onPress={() => onNavigate(item.name)}
          />
        ))}
      </ScrollView>

      {/* User footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <HStack gap={10} align="center">
          <Avatar name={user?.fullName || "U"} size={38} />
          <VStack gap={1} flex={1}>
            <Text variant="label" tone="primary" numberOfLines={1}>
              {user?.fullName}
            </Text>
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {user?.role === "admin" ? "Admin" : user?.roleLabel || "Staff"}
            </Text>
          </VStack>
          <Pressable
            onPress={() => logout()}
            hitSlop={8}
            style={styles.logoutBtn}
          >
            <LogOut size={18} color={palette.text.tertiary} strokeWidth={1.8} />
          </Pressable>
        </HStack>
      </View>
    </View>
  );
}

function NavRow({
  item,
  active,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  onPress: () => void;
}) {
  const Icon = item.icon;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navRow,
        active && styles.navRowActive,
        pressed && !active && { backgroundColor: palette.ink[50] },
      ]}
    >
      <Icon
        size={19}
        color={active ? palette.teal[700] : palette.text.tertiary}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <Text
        variant="label-lg"
        style={{ color: active ? palette.teal[700] : palette.text.secondary }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: layout.sidebarWidth,
    flex: 1,
    backgroundColor: palette.surface.primary,
    borderRightWidth: 1,
    borderRightColor: palette.border.default,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: palette.teal[600],
    alignItems: "center",
    justifyContent: "center",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  navRowActive: { backgroundColor: palette.teal[50] },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: palette.border.default,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
