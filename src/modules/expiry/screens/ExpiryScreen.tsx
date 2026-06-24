import React from "react";
import { View, useWindowDimensions } from "react-native";
import {
  AlarmClock,
  CalendarX2,
  ShieldCheck,
  MapPin,
} from "lucide-react-native";
import { useExpiryReport } from "@modules/expiry/hooks/useExpiry";
import { ExpiryBatch } from "@modules/expiry/api/expiryApi";
import { palette } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  StatTile,
  StatusChip,
  EmptyState,
} from "@shared/ui";

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function ExpiryScreen() {
  const { width } = useWindowDimensions();
  const cols = width >= 800 ? 3 : 1;
  const tileW = cols === 1 ? "100%" : "33.33%";
  const { data, isLoading, refetch, isRefetching } = useExpiryReport();

  const nothing = !isLoading && data && data.summary.total === 0;

  return (
    <Screen
      overline="Expiry Management"
      title="Expiry alerts"
      subtitle={`Thresholds: ${(data?.thresholds || [90, 60, 30]).join(" / ")} days · FEFO never sells expired`}
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
    >
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}
      >
        <View style={{ width: tileW, padding: 6 }}>
          <StatTile
            label="Expired"
            value={String(data?.summary.expired ?? 0)}
            icon={CalendarX2}
            tone={data?.summary.expired ? "cobalt" : "light"}
          />
        </View>
        <View style={{ width: tileW, padding: 6 }}>
          <StatTile
            label="Expiring soon"
            value={String(data?.summary.expiringSoon ?? 0)}
            icon={AlarmClock}
            tone="light"
          />
        </View>
        <View style={{ width: tileW, padding: 6 }}>
          <StatTile
            label="Value at risk"
            value={money(data?.summary.valueAtRisk ?? 0)}
            tone="teal"
          />
        </View>
      </View>

      {nothing ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nothing expiring"
          message="No stock is expired or within your alert window."
        />
      ) : (
        <>
          {(data?.expired.length ?? 0) > 0 && (
            <Section
              title="Expired — remove from sellable stock"
              tone="danger"
              items={data!.expired}
            />
          )}
          {(data?.buckets || [])
            .filter((b) => b.items.length > 0)
            .sort((a, b) => a.days - b.days)
            .map((b) => (
              <Section
                key={b.days}
                title={`Within ${b.days} days`}
                tone={
                  b.days <= 30 ? "danger" : b.days <= 60 ? "warning" : "info"
                }
                items={b.items}
              />
            ))}
        </>
      )}
    </Screen>
  );
}

function Section({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "danger" | "warning" | "info";
  items: ExpiryBatch[];
}) {
  return (
    <View style={{ marginTop: 24 }}>
      <HStack gap={8} align="center" style={{ marginBottom: 12 }}>
        <Text variant="h3" tone="primary">
          {title}
        </Text>
        <StatusChip label={String(items.length)} tone={tone} />
      </HStack>
      <VStack gap={12}>
        {items.map((b) => (
          <Card key={b.batchId} elevation="base">
            <VStack gap={8}>
              <HStack align="center" justify="space-between">
                <VStack gap={2} flex={1}>
                  <Text variant="label-lg" tone="primary" numberOfLines={1}>
                    {b.productName}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    {b.sku} · batch {b.batchNumber}
                  </Text>
                </VStack>
                <Text variant="label-lg" tone="primary">
                  {b.onHand} {b.baseUnit}
                </Text>
              </HStack>
              <HStack gap={6} wrap>
                <StatusChip
                  label={
                    b.expired
                      ? `Expired ${b.expiryDate.slice(0, 10)}`
                      : `${b.daysToExpiry}d · ${b.expiryDate.slice(0, 10)}`
                  }
                  tone={
                    b.expired || b.daysToExpiry <= 30
                      ? "danger"
                      : b.daysToExpiry <= 60
                        ? "warning"
                        : "info"
                  }
                />
                <StatusChip
                  label={`${money(b.stockValue)} at risk`}
                  tone="neutral"
                />
                {b.locations.map((l, i) => (
                  <View key={i} style={locPill}>
                    <MapPin
                      size={12}
                      color={palette.teal[600]}
                      strokeWidth={2}
                    />
                    <Text variant="label-sm" tone="secondary">
                      {l.code} · {l.quantity}
                    </Text>
                  </View>
                ))}
              </HStack>
            </VStack>
          </Card>
        ))}
      </VStack>
    </View>
  );
}

const locPill = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: palette.teal[50],
};
