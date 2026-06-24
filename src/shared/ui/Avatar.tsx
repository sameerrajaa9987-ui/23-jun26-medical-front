import React from "react";
import { View, StyleSheet } from "react-native";
import { palette, radius } from "../designSystem";
import { Text } from "./Text";

interface Props {
  name: string;
  size?: number;
  tone?: "teal" | "cobalt" | "slate";
}

const FILLS = {
  teal: { bg: palette.teal[100], fg: palette.teal[700] },
  cobalt: { bg: palette.cobalt[100], fg: palette.cobalt[700] },
  slate: { bg: palette.ink[100], fg: palette.ink[700] },
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function Avatar({ name, size = 40, tone = "teal" }: Props) {
  const c = FILLS[tone];
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: c.bg,
        },
      ]}
    >
      <Text weight="700" style={{ color: c.fg, fontSize: size * 0.4 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
