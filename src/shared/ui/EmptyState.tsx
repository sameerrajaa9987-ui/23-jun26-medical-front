import React from "react";
import { View, StyleSheet } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { palette, radius } from "../designSystem";
import { Text } from "./Text";
import { VStack } from "./Stack";

interface Props {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: Props) {
  return (
    <VStack
      align="center"
      gap={12}
      style={{ marginTop: 64, paddingHorizontal: 24 }}
    >
      <View style={styles.icon}>
        <Icon size={32} color={palette.teal[500]} strokeWidth={1.6} />
      </View>
      <Text variant="h3" tone="secondary" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body-sm" tone="tertiary" align="center">
          {message}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </VStack>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: palette.teal[50],
    alignItems: "center",
    justifyContent: "center",
  },
});
