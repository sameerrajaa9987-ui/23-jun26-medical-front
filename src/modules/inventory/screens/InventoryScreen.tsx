import React, { useState } from "react";
import { View, TextInput, StyleSheet, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Search,
  Boxes,
  IndianRupee,
  PackageX,
  ChevronRight,
} from "lucide-react-native";
import { useStock, useStockValue } from "@modules/inventory/hooks/useInventory";
import { StockSummaryItem } from "@modules/inventory/types";
import { palette, radius, outline } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  StatTile,
  StatusChip,
  ChipsRow,
  EmptyState,
} from "@shared/ui";

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const cols = width >= 1000 ? 3 : width >= 640 ? 3 : 1;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: value } = useStockValue();
  const params: { search?: string; lowStockOnly?: boolean } = {};
  if (search.trim()) params.search = search.trim();
  if (filter === "low") params.lowStockOnly = true;
  const { data: items, isLoading, refetch, isRefetching } = useStock(params);
  const list = items ?? [];

  const tileW = cols === 1 ? "100%" : "33.33%";

  return (
    <Screen
      overline="Inventory"
      title="Stock on hand"
      subtitle="Live quantity, availability and valuation"
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
    >
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}
      >
        <View style={{ width: tileW, padding: 6 }}>
          <StatTile
            label="Stock value (cost)"
            value={money(value?.costValue ?? 0)}
            icon={IndianRupee}
            tone="teal"
          />
        </View>
        <View style={{ width: tileW, padding: 6 }}>
          <StatTile
            label="Retail value"
            value={money(value?.sellValue ?? 0)}
            icon={IndianRupee}
            tone="light"
          />
        </View>
        <View style={{ width: tileW, padding: 6 }}>
          <StatTile
            label="Units in stock"
            value={String(value?.totalUnits ?? 0)}
            icon={Boxes}
            tone="light"
          />
        </View>
      </View>

      <View style={[styles.searchWrap, { marginTop: 14 }]}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search products in stock"
          placeholderTextColor={palette.text.tertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>
      <View style={{ marginHorizontal: -24, marginTop: 12 }}>
        <ChipsRow
          chips={[
            { key: "all", label: "All stock" },
            { key: "low", label: "Low stock" },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </View>

      {list.length === 0 ? (
        <EmptyState
          icon={filter === "low" ? PackageX : Boxes}
          title={
            isLoading
              ? "Loading…"
              : filter === "low"
                ? "No low-stock items"
                : "No stock yet"
          }
          message={
            filter === "low"
              ? "Everything is above its reorder level."
              : "Receive stock to see it here."
          }
        />
      ) : (
        <VStack gap={12} style={{ marginTop: 16 }}>
          {list.map((s) => (
            <StockRow
              key={s.productId}
              item={s}
              onPress={() =>
                navigation.navigate("ProductInventory", { id: s.productId })
              }
            />
          ))}
        </VStack>
      )}
    </Screen>
  );
}

function StockRow({
  item,
  onPress,
}: {
  item: StockSummaryItem;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <View
          style={[
            styles.icon,
            item.isLow && { backgroundColor: palette.warning.bg },
          ]}
        >
          <Boxes
            size={20}
            color={item.isLow ? palette.warning.text : palette.teal[600]}
            strokeWidth={1.9}
          />
        </View>
        <VStack gap={4} flex={1}>
          <Text variant="label-lg" tone="primary" numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="body-sm" tone="tertiary" numberOfLines={1}>
            {item.sku} · {item.batches} batch{item.batches === 1 ? "" : "es"} ·{" "}
            {item.locations} location{item.locations === 1 ? "" : "s"}
          </Text>
          <HStack gap={6} wrap>
            <StatusChip
              label={`${item.available}/${item.onHand} ${item.baseUnit}`}
              tone="info"
            />
            <StatusChip
              label={`${money(item.costValue)} cost`}
              tone="neutral"
            />
            {item.isLow && <StatusChip label="Low stock" tone="warning" />}
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
  icon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: palette.teal[50],
    alignItems: "center",
    justifyContent: "center",
  },
});
