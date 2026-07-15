import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Search, Plus, Truck, ChevronRight } from "lucide-react-native";
import { useSuppliers } from "@modules/supplier/hooks/useSuppliers";
import { Supplier } from "@modules/supplier/types";
import { useAuthStore } from "@shared/store/useAuthStore";
import { PERMISSIONS } from "@shared/permissions";
import { palette, radius, outline } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Avatar,
  Button,
  StatusChip,
  EmptyState,
  Pagination,
} from "@shared/ui";

export default function SuppliersScreen() {
  const navigation = useNavigation<any>();
  const canWrite = useAuthStore((s) => s.hasPermission)(
    PERMISSIONS.SUPPLIERS_MANAGE,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Filter change → back to page 1 (adjusted during render, not in an effect).
  const filterKey = `${search}|${limit}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, refetch, isRefetching } = useSuppliers({
    ...(search.trim() ? { search: search.trim() } : {}),
    page,
    limit,
  });
  const suppliers = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.pages ?? 1;

  if (!isLoading && totalPages > 0 && page > totalPages) setPage(totalPages);

  return (
    <Screen
      overline="Partners"
      title="Suppliers"
      subtitle={`${total.toLocaleString("en-IN")} suppliers`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        canWrite ? (
          <Button
            label="Add supplier"
            fullWidth={false}
            icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.2} />}
            onPress={() => navigation.navigate("SupplierForm")}
          />
        ) : undefined
      }
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search supplier"
          placeholderTextColor={palette.text.tertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={isLoading ? "Loading…" : "No suppliers yet"}
          message="Add suppliers to record purchases and track supplied products."
        />
      ) : (
        <VStack gap={12} style={{ marginTop: 16 }}>
          {suppliers.map((s) => (
            <SupplierRow
              key={s.id}
              supplier={s}
              onPress={() =>
                navigation.navigate("SupplierDetail", { id: s.id })
              }
            />
          ))}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            label="suppliers"
          />
        </VStack>
      )}
    </Screen>
  );
}

function SupplierRow({
  supplier,
  onPress,
}: {
  supplier: Supplier;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <Avatar name={supplier.name} size={46} tone="slate" />
        <VStack gap={4} flex={1}>
          <Text variant="label-lg" tone="primary" numberOfLines={1}>
            {supplier.name}
          </Text>
          <Text variant="body-sm" tone="tertiary" numberOfLines={1}>
            {[supplier.contactPerson, supplier.mobile]
              .filter(Boolean)
              .join(" · ") || "No contact"}
          </Text>
          {supplier.gstin ? (
            <StatusChip label={`GSTIN ${supplier.gstin}`} tone="neutral" />
          ) : null}
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
