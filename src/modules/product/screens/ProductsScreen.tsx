import React, { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Search, Plus, Package, ChevronRight, Pill } from "lucide-react-native";
import { useProducts, useCategories } from "@modules/product/hooks/useProducts";
import { ProductListItem } from "@modules/product/types";
import { useAuthStore } from "@shared/store/useAuthStore";
import { PERMISSIONS } from "@shared/permissions";
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

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission(PERMISSIONS.PRODUCTS_MANAGE);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const { data: categories } = useCategories();
  const params: { search?: string; categoryId?: string } = {};
  if (search.trim()) params.search = search.trim();
  if (categoryId !== "all") params.categoryId = categoryId;

  const { data, isLoading, refetch, isRefetching } = useProducts(params);
  const products = data?.data ?? [];

  const categoryChips = [
    { key: "all", label: "All" },
    ...(categories || []).map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <Screen
      overline="Catalogue"
      title="Products"
      subtitle={`${data?.meta?.total ?? 0} products`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        canManage ? (
          <Button
            label="Add product"
            fullWidth={false}
            icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.2} />}
            onPress={() => navigation.navigate("ProductForm")}
          />
        ) : undefined
      }
    >
      <View style={styles.searchWrap}>
        <Search size={18} color={palette.text.tertiary} strokeWidth={1.8} />
        <TextInput
          placeholder="Search name, SKU, barcode, HSN"
          placeholderTextColor={palette.text.tertiary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      {categoryChips.length > 1 && (
        <View style={{ marginHorizontal: -24, marginTop: 12 }}>
          <ChipsRow
            chips={categoryChips}
            active={categoryId}
            onChange={setCategoryId}
          />
        </View>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={isLoading ? "Loading…" : "No products yet"}
          message="Add your first product to start building the catalogue."
          action={
            canManage ? (
              <Button
                label="Add product"
                fullWidth={false}
                onPress={() => navigation.navigate("ProductForm")}
              />
            ) : undefined
          }
        />
      ) : (
        <VStack gap={12} style={{ marginTop: 16 }}>
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              onPress={() => navigation.navigate("ProductForm", { id: p.id })}
            />
          ))}
        </VStack>
      )}
    </Screen>
  );
}

function ProductRow({
  product,
  onPress,
}: {
  product: ProductListItem;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <View style={styles.icon}>
          <Package size={20} color={palette.teal[600]} strokeWidth={1.9} />
        </View>
        <VStack gap={4} flex={1}>
          <HStack gap={8} align="center">
            <Text variant="label-lg" tone="primary" numberOfLines={1}>
              {product.name}
            </Text>
            {product.prescriptionRequired && (
              <Pill size={14} color={palette.danger.text} strokeWidth={2} />
            )}
          </HStack>
          <Text variant="body-sm" tone="tertiary" numberOfLines={1}>
            {[product.sku, product.brandName, product.categoryName]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
          <HStack gap={6} wrap>
            <StatusChip
              label={`₹${product.sellingPrice} / ${product.baseUnit}`}
              tone="info"
            />
            {product.taxRatePct > 0 && (
              <StatusChip label={`GST ${product.taxRatePct}%`} tone="neutral" />
            )}
            {product.scheduleDrug ? (
              <StatusChip
                label={`Schedule ${product.scheduleDrug}`}
                tone="warning"
              />
            ) : null}
            {!product.isActive && <StatusChip label="Inactive" tone="danger" />}
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
