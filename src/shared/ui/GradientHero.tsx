import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, shadows, gradients } from "../designSystem";

type Variant = "hero" | "teal" | "cobalt";

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

const GRAD: Record<Variant, readonly string[]> = {
  hero: gradients.hero,
  teal: gradients.teal,
  cobalt: gradients.cobalt,
};

/** Hero — soft clinical gradient block with rounded corners and elevation. */
export function GradientHero({ children, variant = "hero", style }: Props) {
  return (
    <View style={[styles.wrap, shadows.md, style]}>
      <LinearGradient
        colors={[...GRAD[variant]] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: "hidden" },
  grad: { borderRadius: radius.xl },
  content: { padding: 22 },
});
