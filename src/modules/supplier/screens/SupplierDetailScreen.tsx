import React from "react";
import { View, Pressable, Platform, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  PackageCheck,
  Trash2,
} from "lucide-react-native";
import {
  useSupplier,
  useSupplierPurchases,
  useRemoveSupplier,
} from "@modules/supplier/hooks/useSuppliers";
import { useAuthStore } from "@shared/store/useAuthStore";
import { PERMISSIONS } from "@shared/permissions";
import { palette } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Avatar,
  Button,
  StatusChip,
  StatTile,
  EmptyState,
} from "@shared/ui";

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function confirm(msg: string, onYes: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(msg)) onYes();
  } else
    Alert.alert("Please confirm", msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: onYes },
    ]);
}

export default function SupplierDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string;
  const { data: supplier } = useSupplier(id);
  const { data: purchases } = useSupplierPurchases(id);
  const removeMut = useRemoveSupplier();
  const canManage = useAuthStore((s) => s.hasPermission)(
    PERMISSIONS.SUPPLIERS_MANAGE,
  );

  return (
    <Screen
      overline="Supplier"
      title={supplier?.name || "Supplier"}
      subtitle={supplier?.contactPerson || ""}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={6}
        style={{ marginBottom: 16 }}
      >
        <HStack gap={6} align="center">
          <ArrowLeft size={18} color={palette.text.link} strokeWidth={2} />
          <Text variant="label" tone="link">
            Back to suppliers
          </Text>
        </HStack>
      </Pressable>

      <Card style={{ marginBottom: 16 }}>
        <HStack gap={14} align="center">
          <Avatar name={supplier?.name || "?"} size={54} tone="slate" />
          <VStack gap={6} flex={1}>
            {supplier?.mobile ? (
              <HStack gap={6} align="center">
                <Phone
                  size={14}
                  color={palette.text.tertiary}
                  strokeWidth={1.9}
                />
                <Text variant="body-sm" tone="secondary">
                  {supplier.mobile}
                </Text>
              </HStack>
            ) : null}
            {supplier?.email ? (
              <HStack gap={6} align="center">
                <Mail
                  size={14}
                  color={palette.text.tertiary}
                  strokeWidth={1.9}
                />
                <Text variant="body-sm" tone="secondary">
                  {supplier.email}
                </Text>
              </HStack>
            ) : null}
            {supplier?.address ? (
              <HStack gap={6} align="center">
                <MapPin
                  size={14}
                  color={palette.text.tertiary}
                  strokeWidth={1.9}
                />
                <Text variant="body-sm" tone="secondary">
                  {supplier.address}
                </Text>
              </HStack>
            ) : null}
            {supplier?.gstin ? (
              <StatusChip label={`GSTIN ${supplier.gstin}`} tone="neutral" />
            ) : null}
          </VStack>
          {canManage && (
            <Button
              label="Edit"
              variant="secondary"
              fullWidth={false}
              icon={
                <Pencil
                  size={15}
                  color={palette.text.primary}
                  strokeWidth={2}
                />
              }
              onPress={() => navigation.navigate("SupplierForm", { id })}
            />
          )}
        </HStack>
      </Card>

      <HStack gap={12} style={{ marginBottom: 24 }}>
        <View style={{ flex: 1 }}>
          <StatTile
            label="Purchases"
            value={String(supplier?.purchases?.count ?? 0)}
            tone="light"
          />
        </View>
        <View style={{ flex: 1 }}>
          <StatTile
            label="Total purchased"
            value={money(supplier?.purchases?.value ?? 0)}
            tone="teal"
          />
        </View>
      </HStack>

      <Text variant="h3" tone="primary" style={{ marginBottom: 12 }}>
        Purchase history
      </Text>
      {(purchases || []).length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="No purchases yet"
          message="Goods received from this supplier appear here."
        />
      ) : (
        <VStack gap={12}>
          {(purchases || []).map((p) => (
            <Card key={p.id} elevation="base">
              <HStack align="center" justify="space-between">
                <VStack gap={3} flex={1}>
                  <Text variant="label-lg" tone="primary">
                    {p.receiptNo}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    {new Date(p.receivedAt).toLocaleDateString()} ·{" "}
                    {p.lineCount} line{p.lineCount === 1 ? "" : "s"} ·{" "}
                    {p.totalQuantity} units
                  </Text>
                </VStack>
                <Text variant="label-lg" tone="primary">
                  {money(p.totalValue)}
                </Text>
              </HStack>
            </Card>
          ))}
        </VStack>
      )}

      {canManage && supplier?.isActive && (
        <Button
          label="Deactivate supplier"
          variant="destructive"
          icon={<Trash2 size={16} color="#FFFFFF" strokeWidth={2} />}
          style={{ marginTop: 24 }}
          loading={removeMut.isPending}
          onPress={() =>
            confirm("Deactivate this supplier?", () =>
              removeMut.mutate(id, { onSuccess: () => navigation.goBack() }),
            )
          }
        />
      )}
    </Screen>
  );
}
