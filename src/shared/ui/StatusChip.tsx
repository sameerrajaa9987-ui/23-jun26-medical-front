import React from "react";
import { View, StyleSheet } from "react-native";
import { palette, radius } from "../designSystem";
import { Text } from "./Text";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<Tone, { bg: string; text: string; border: string }> = {
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  neutral: {
    bg: palette.neutral[100],
    text: palette.text.secondary,
    border: palette.border.default,
  },
};

export function StatusChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  const c = TONES[tone];
  return (
    <View
      style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      <Text variant="label-sm" weight="600" style={{ color: c.text }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
