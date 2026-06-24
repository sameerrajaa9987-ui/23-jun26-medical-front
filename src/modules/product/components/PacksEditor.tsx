import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Plus, X } from "lucide-react-native";
import { PackUnit } from "@modules/product/types";
import { palette, radius } from "@shared/designSystem";
import { Text, VStack, HStack, TextField } from "@shared/ui";

interface Props {
  baseUnit: string;
  packs: PackUnit[];
  onChange: (packs: PackUnit[]) => void;
}

/**
 * Editor for the unit-of-measure pack hierarchy (SOW §9.7). Each row defines a
 * pack unit and how many BASE units it contains (e.g. 1 strip = 10 tablets).
 */
export function PacksEditor({ baseUnit, packs, onChange }: Props) {
  const update = (i: number, patch: Partial<PackUnit>) =>
    onChange(packs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const add = () => onChange([...packs, { unit: "", factor: 1 }]);
  const remove = (i: number) => onChange(packs.filter((_, idx) => idx !== i));

  return (
    <VStack gap={10}>
      <Text variant="caption" tone="tertiary">
        1 pack unit = N × base unit ({baseUnit || "base"}). E.g. 1 strip = 10{" "}
        {baseUnit || "tablet"}.
      </Text>
      {packs.map((p, i) => (
        <HStack key={i} gap={10} align="flex-end">
          <View style={{ flex: 1.4 }}>
            <TextField
              label={i === 0 ? "Pack unit" : undefined}
              placeholder="strip"
              value={p.unit}
              onChangeText={(v) => update(i, { unit: v })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label={i === 0 ? `× ${baseUnit || "base"}` : undefined}
              placeholder="10"
              keyboardType="decimal-pad"
              value={p.factor ? String(p.factor) : ""}
              onChangeText={(v) => update(i, { factor: Number(v) || 0 })}
            />
          </View>
          <Pressable onPress={() => remove(i)} style={styles.removeBtn}>
            <X size={18} color={palette.danger.text} strokeWidth={2} />
          </Pressable>
        </HStack>
      ))}
      <Pressable onPress={add} style={styles.addRow}>
        <Plus size={18} color={palette.teal[600]} strokeWidth={2.2} />
        <Text variant="label" tone="accent">
          Add pack unit
        </Text>
      </Pressable>
    </VStack>
  );
}

const styles = StyleSheet.create({
  removeBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: palette.danger.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
});
