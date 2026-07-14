/** Text — all typography routes through here for a consistent type system. */
import React from "react";
import { Text as RNText, TextStyle, StyleProp } from "react-native";
import { typography, palette, fonts } from "../designSystem";

type Variant =
  | "display-lg"
  | "display-md"
  | "display-sm"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body-lg"
  | "body"
  | "body-sm"
  | "label-lg"
  | "label"
  | "label-sm"
  | "caption"
  | "overline";

type Tone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "disabled"
  | "inverse"
  | "accent"
  | "link"
  | "danger"
  | "success"
  | "warning";

interface Props {
  variant?: Variant;
  tone?: Tone;
  weight?: "400" | "500" | "600" | "700";
  align?: "left" | "center" | "right";
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const variantMap = {
  "display-lg": typography.display.large,
  "display-md": typography.display.medium,
  "display-sm": typography.display.small,
  h1: typography.heading.h1,
  h2: typography.heading.h2,
  h3: typography.heading.h3,
  h4: typography.heading.h4,
  "body-lg": typography.body.large,
  body: typography.body.default,
  "body-sm": typography.body.small,
  "label-lg": typography.label.large,
  label: typography.label.medium,
  "label-sm": typography.label.small,
  caption: typography.caption,
  overline: typography.overline,
} as const;

const toneMap: Record<Tone, string> = {
  primary: palette.text.primary,
  secondary: palette.text.secondary,
  tertiary: palette.text.tertiary,
  disabled: palette.text.disabled,
  inverse: palette.text.inverse,
  accent: palette.text.accent,
  link: palette.text.link,
  danger: palette.danger.text,
  success: palette.success.text,
  warning: palette.warning.text,
};

/**
 * With per-weight font files, the family (not `fontWeight`) sets the visual
 * weight on native. When a screen overrides `weight`, swap to the matching
 * family in the same family group (Poppins for headings, Inter for the rest).
 */
function familyForWeight(variant: Variant, weight: string): string {
  const isHeading =
    variant.startsWith("display") ||
    variant === "h1" ||
    variant === "h2" ||
    variant === "h3" ||
    variant === "h4";
  if (isHeading) return Number(weight) >= 700 ? fonts.display : fonts.heading;
  const w = Number(weight);
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  if (w >= 500) return fonts.bodyMedium;
  return fonts.bodyRegular;
}

export function Text({
  variant = "body",
  tone = "primary",
  weight,
  align,
  numberOfLines,
  adjustsFontSizeToFit,
  style,
  children,
}: Props) {
  const base = variantMap[variant];
  return (
    <RNText
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      style={[
        base,
        { color: toneMap[tone] },
        weight
          ? { fontWeight: weight, fontFamily: familyForWeight(variant, weight) }
          : undefined,
        align ? { textAlign: align } : undefined,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
