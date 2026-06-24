import React, { useState } from "react";
import { View, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { ChevronDown, Check, Plus, X } from "lucide-react-native";
import { palette, radius, outline, shadows } from "../designSystem";
import { Text } from "./Text";
import { TextField } from "./TextField";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  /** When provided, shows an "Add new" field that creates an option inline. */
  onCreate?: (
    label: string,
  ) => Promise<{ value: string; label: string } | void>;
  allowClear?: boolean;
}

/** Select — a labeled field that opens a modal option list (web + native). */
export function Select({
  label,
  placeholder = "Select…",
  value,
  options,
  onChange,
  onCreate,
  allowClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const selected = options.find((o) => o.value === value);

  const create = async () => {
    if (!onCreate || !newLabel.trim()) return;
    setCreating(true);
    try {
      const made = await onCreate(newLabel.trim());
      if (made) onChange(made.value);
      setNewLabel("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View>
      {label && (
        <Text variant="label" tone="secondary" style={{ marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <Pressable onPress={() => setOpen(true)} style={styles.field}>
        <Text
          variant="body"
          tone={selected ? "primary" : "tertiary"}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown
          size={18}
          color={palette.text.tertiary}
          strokeWidth={1.8}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text variant="h4" tone="primary">
                {label || "Select"}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <X size={20} color={palette.text.tertiary} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {allowClear && (
                <OptionRow
                  label="None"
                  selected={!value}
                  onPress={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                />
              )}
              {options.map((o) => (
                <OptionRow
                  key={o.value}
                  label={o.label}
                  selected={o.value === value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                />
              ))}
              {options.length === 0 && (
                <Text variant="body-sm" tone="tertiary" style={{ padding: 16 }}>
                  No options yet.
                </Text>
              )}
            </ScrollView>

            {onCreate && (
              <View style={styles.createRow}>
                <View style={{ flex: 1 }}>
                  <TextField
                    placeholder="Add new…"
                    value={newLabel}
                    onChangeText={setNewLabel}
                    onSubmitEditing={create}
                  />
                </View>
                <Pressable
                  onPress={create}
                  disabled={creating || !newLabel.trim()}
                  style={styles.addBtn}
                >
                  <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        pressed && { backgroundColor: palette.ink[50] },
      ]}
    >
      <Text
        variant="body"
        tone={selected ? "accent" : "primary"}
        style={{ flex: 1 }}
      >
        {label}
      </Text>
      {selected && (
        <Check size={18} color={palette.teal[600]} strokeWidth={2.4} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: outline.width,
    borderColor: outline.color,
    backgroundColor: palette.surface.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: palette.surface.primary,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border.default,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: palette.teal[600],
    alignItems: "center",
    justifyContent: "center",
  },
});
