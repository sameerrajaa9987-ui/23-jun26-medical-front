/** TextField — clinical, focus-aware, soft rounded. */
import React, { useState } from "react";
import { View, TextInput, TextInputProps, StyleSheet } from "react-native";
import { palette, radius, outline } from "../designSystem";
import { Text } from "./Text";

interface Props extends Omit<TextInputProps, "style"> {
  label?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  leading,
  trailing,
  error,
  hint,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? palette.danger.text
    : focused
      ? palette.teal[500]
      : outline.color;

  return (
    <View>
      {label && (
        <Text variant="label" tone="secondary" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.wrap,
          {
            borderColor,
            backgroundColor: palette.surface.primary,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {leading && <View style={{ marginRight: 10 }}>{leading}</View>}
        <TextInput
          {...inputProps}
          placeholderTextColor={palette.text.tertiary}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          // @ts-expect-error web-only outline reset
          style={[styles.input, { outlineStyle: "none" }]}
        />
        {trailing && <View style={{ marginLeft: 10 }}>{trailing}</View>}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" style={{ marginTop: 6 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary" style={{ marginTop: 6 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: palette.text.primary,
    paddingVertical: 13,
  },
});
