import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Search, Plus, Users, Phone, ChevronRight } from "lucide-react-native";
import { useCustomers } from "@modules/customer/hooks/useCustomers";
import { Customer } from "@modules/customer/types";
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

export default function CustomersScreen() {
  const navigation = useNavigation<any>();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canWrite =
    hasPermission(PERMISSIONS.CUSTOMERS_MANAGE) ||
    hasPermission(PERMISSIONS.SALES_MANAGE);
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

  const { data, isLoading, refetch, isRefetching } = useCustomers({
    ...(search.trim() ? { search: search.trim() } : {}),
    page,
    limit,
  });
  const customers = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.pages ?? 1;

  if (!isLoading && totalPages > 0 && page > totalPages) setPage(totalPages);

  return (
    <Screen
      overline="Partners"
      title="Customers"
      subtitle={`${total.toLocaleString("en-IN")} customers`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        canWrite ? (
          <Button
            label="Add customer"
            fullWidth={false}
            icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.2} />}
            onPress={() => navigation.navigate("CustomerForm")}
          />
        ) : undefined
      }
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search by name or mobile"
          placeholderTextColor={palette.text.tertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isLoading ? "Loading…" : "No customers yet"}
          message="Add customers to track purchase history and speed up billing."
        />
      ) : (
        <VStack gap={12} style={{ marginTop: 16 }}>
          {customers.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              onPress={() =>
                navigation.navigate("CustomerDetail", { id: c.id })
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
            label="customers"
          />
        </VStack>
      )}
    </Screen>
  );
}

function CustomerRow({
  customer,
  onPress,
}: {
  customer: Customer;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <Avatar name={customer.name} size={46} />
        <VStack gap={4} flex={1}>
          <Text variant="label-lg" tone="primary" numberOfLines={1}>
            {customer.name}
          </Text>
          <HStack gap={6} align="center">
            {customer.mobile ? (
              <>
                <Phone
                  size={13}
                  color={palette.text.tertiary}
                  strokeWidth={1.9}
                />
                <Text variant="body-sm" tone="tertiary">
                  {customer.mobile}
                </Text>
              </>
            ) : (
              <Text variant="body-sm" tone="tertiary">
                No mobile
              </Text>
            )}
          </HStack>
          {customer.gstin ? (
            <StatusChip label={`GSTIN ${customer.gstin}`} tone="neutral" />
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
