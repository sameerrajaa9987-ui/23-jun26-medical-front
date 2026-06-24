import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Search, Plus, Receipt, ChevronRight } from "lucide-react-native";
import { useSales } from "@modules/sale/hooks/useSales";
import { SaleListItem } from "@modules/sale/types";
import { palette, radius, outline } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  StatusChip,
  ChipsRow,
  EmptyState,
} from "@shared/ui";

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const STATUS_TONE = {
  completed: "success",
  partially_returned: "warning",
  returned: "danger",
} as const;

export default function SalesListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const params: { search?: string; status?: string } = {};
  if (search.trim()) params.search = search.trim();
  if (status !== "all") params.status = status;
  const { data, isLoading, refetch, isRefetching } = useSales(params);
  const sales = data?.data ?? [];

  return (
    <Screen
      overline="Sales"
      title="Invoices"
      subtitle={`${data?.meta?.total ?? 0} sales`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        <Button
          label="New sale"
          fullWidth={false}
          icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.2} />}
          onPress={() => navigation.navigate("NewSale")}
        />
      }
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search invoice, customer or mobile"
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
            { key: "all", label: "All" },
            { key: "completed", label: "Completed" },
            { key: "partially_returned", label: "Part-returned" },
            { key: "returned", label: "Returned" },
          ]}
          active={status}
          onChange={setStatus}
        />
      </View>

      {sales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={isLoading ? "Loading…" : "No sales yet"}
          message="Create a sale to generate a GST invoice."
        />
      ) : (
        <VStack gap={12} style={{ marginTop: 16 }}>
          {sales.map((s) => (
            <SaleRow
              key={s.id}
              sale={s}
              onPress={() => navigation.navigate("SaleDetail", { id: s.id })}
            />
          ))}
        </VStack>
      )}
    </Screen>
  );
}

function SaleRow({
  sale,
  onPress,
}: {
  sale: SaleListItem;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <Receipt size={22} color={palette.teal[600]} strokeWidth={1.9} />
        <VStack gap={4} flex={1}>
          <Text variant="label-lg" tone="primary">
            {sale.invoiceNo}
          </Text>
          <Text variant="body-sm" tone="tertiary" numberOfLines={1}>
            {[
              sale.customerName,
              new Date(sale.saleDate).toLocaleDateString(),
              `${sale.itemCount} item${sale.itemCount === 1 ? "" : "s"}`,
            ].join("  ·  ")}
          </Text>
          <HStack gap={6} wrap>
            <StatusChip
              label={sale.status.replace("_", " ")}
              tone={STATUS_TONE[sale.status]}
            />
            {sale.paymentMode ? (
              <StatusChip label={sale.paymentMode} tone="neutral" />
            ) : null}
          </HStack>
        </VStack>
        <VStack gap={2} align="flex-end">
          <Text variant="label-lg" tone="primary">
            {money(sale.grandTotal)}
          </Text>
          {sale.totalReturned > 0 && (
            <Text variant="caption" tone="danger">
              -{money(sale.totalReturned)}
            </Text>
          )}
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
});
