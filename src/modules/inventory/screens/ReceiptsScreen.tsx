import React, { useState } from "react";
import { Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ChevronRight,
  PackageCheck,
  ScrollText,
} from "lucide-react-native";
import { useReceipts } from "@modules/inventory/hooks/useInventory";
import { ReceiptListItem } from "@modules/inventory/types";
import { palette } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  StatusChip,
  EmptyState,
  Pagination,
} from "@shared/ui";

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function ReceiptsScreen() {
  const navigation = useNavigation<any>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const { data, isLoading, refetch, isRefetching } = useReceipts({
    page,
    limit,
  });
  const receipts = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.pages ?? 1;

  // Snap back if the result set shrank below the current page.
  if (!isLoading && totalPages > 0 && page > totalPages) setPage(totalPages);

  return (
    <Screen
      overline="Stock Inward"
      title="Receipt history"
      subtitle={`${total.toLocaleString("en-IN")} goods-received notes`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={6}
        style={{ marginBottom: 16 }}
      >
        <HStack gap={6} align="center">
          <ArrowLeft size={18} color={palette.text.link} strokeWidth={2} />
          <Text variant="label" tone="link">
            Back to receive
          </Text>
        </HStack>
      </Pressable>

      {receipts.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={isLoading ? "Loading…" : "No receipts yet"}
          message="Received stock will be listed here as GRNs."
        />
      ) : (
        <VStack gap={12}>
          {receipts.map((r) => (
            <ReceiptRow
              key={r.id}
              receipt={r}
              onPress={() => navigation.navigate("ReceiptDetail", { id: r.id })}
            />
          ))}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            label="receipts"
          />
        </VStack>
      )}
    </Screen>
  );
}

function ReceiptRow({
  receipt,
  onPress,
}: {
  receipt: ReceiptListItem;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} elevation="base">
      <HStack gap={14} align="center">
        <PackageCheck size={22} color={palette.teal[600]} strokeWidth={1.9} />
        <VStack gap={4} flex={1}>
          <Text variant="label-lg" tone="primary">
            {receipt.receiptNo}
          </Text>
          <Text variant="body-sm" tone="tertiary" numberOfLines={1}>
            {[
              receipt.supplierName || "No supplier",
              new Date(receipt.receivedAt).toLocaleDateString(),
              receipt.receivedByName,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
          <HStack gap={6} wrap>
            <StatusChip
              label={`${receipt.lineCount} line${receipt.lineCount === 1 ? "" : "s"}`}
              tone="neutral"
            />
            <StatusChip label={`${receipt.totalQuantity} units`} tone="info" />
            <StatusChip label={money(receipt.totalValue)} tone="success" />
          </HStack>
        </VStack>
        <ChevronRight size={18} color={palette.text.tertiary} strokeWidth={2} />
      </HStack>
    </Card>
  );
}
