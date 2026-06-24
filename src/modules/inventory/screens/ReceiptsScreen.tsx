import React from "react";
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
} from "@shared/ui";

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function ReceiptsScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, isRefetching } = useReceipts();
  const receipts = data?.data ?? [];

  return (
    <Screen
      overline="Stock Inward"
      title="Receipt history"
      subtitle={`${data?.meta?.total ?? 0} goods-received notes`}
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
