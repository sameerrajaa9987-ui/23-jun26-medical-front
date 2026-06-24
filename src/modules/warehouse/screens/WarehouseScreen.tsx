import React, { useState } from "react";
import { View, Platform, Alert } from "react-native";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react-native";
import {
  useWarehouseTree,
  useRemoveLocation,
} from "@modules/warehouse/hooks/useWarehouse";
import { LocationTreeNode } from "@modules/warehouse/types";
import { useAuthStore } from "@shared/store/useAuthStore";
import { PERMISSIONS } from "@shared/permissions";
import { apiErrorMessage } from "@api/apiClient";
import { palette } from "@shared/designSystem";
import { Screen, Text, VStack, Card, Button, EmptyState } from "@shared/ui";
import { LocationNode } from "@modules/warehouse/components/LocationNode";
import { LocationModal } from "@modules/warehouse/components/LocationModal";

type ModalState =
  | { mode: "createWarehouse" }
  | { mode: "createChild"; parent: LocationTreeNode }
  | { mode: "rename"; node: LocationTreeNode }
  | null;

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (window.confirm(message)) onYes();
  } else {
    Alert.alert("Please confirm", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: onYes },
    ]);
  }
}

export default function WarehouseScreen() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission(PERMISSIONS.WAREHOUSE_MANAGE);
  const { data: roots, isLoading, refetch, isRefetching } = useWarehouseTree();
  const removeMut = useRemoveLocation();
  const [modal, setModal] = useState<ModalState>(null);

  const warehouses = roots ?? [];

  const onRemove = (node: LocationTreeNode) =>
    confirm(
      node.children.length
        ? `"${node.name}" has sub-locations and can't be removed until they are deleted.`
        : `Remove ${node.type} "${node.name}" (${node.code})?`,
      () =>
        removeMut.mutate(node.id, {
          onError: (e) => {
            if (Platform.OS === "web") window.alert(apiErrorMessage(e));
          },
        }),
    );

  return (
    <Screen
      overline="Warehouse"
      title="Warehouse Setup"
      subtitle="Warehouse › Zone › Wall › Shelf › Rack › Drawer — auto-coded locations"
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        canManage ? (
          <Button
            label="New warehouse"
            fullWidth={false}
            icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.2} />}
            onPress={() => setModal({ mode: "createWarehouse" })}
          />
        ) : undefined
      }
    >
      {warehouses.length === 0 ? (
        <EmptyState
          icon={WarehouseIcon}
          title={isLoading ? "Loading…" : "No warehouses yet"}
          message="Create a warehouse, then build out zones, walls, shelves, racks and drawers. Each gets a unique location code."
          action={
            canManage ? (
              <Button
                label="Create warehouse"
                fullWidth={false}
                onPress={() => setModal({ mode: "createWarehouse" })}
              />
            ) : undefined
          }
        />
      ) : (
        <VStack gap={16}>
          {warehouses.map((wh) => (
            <Card
              key={wh.id}
              padded={false}
              elevation="base"
              style={{ overflow: "hidden", paddingVertical: 4 }}
            >
              <LocationNode
                node={wh}
                depth={0}
                canManage={canManage}
                onAddChild={(parent) =>
                  setModal({ mode: "createChild", parent })
                }
                onRename={(node) => setModal({ mode: "rename", node })}
                onRemove={onRemove}
              />
            </Card>
          ))}
          {canManage && (
            <Text variant="caption" tone="tertiary" align="center">
              Tap the + on any location to add the next level. Codes like
              WH1-W1-S2-R3-D4 are generated automatically.
            </Text>
          )}
        </VStack>
      )}

      <LocationModal
        visible={modal !== null}
        mode={modal?.mode || "createWarehouse"}
        parent={modal && modal.mode === "createChild" ? modal.parent : null}
        node={modal && modal.mode === "rename" ? modal.node : null}
        onClose={() => setModal(null)}
      />
    </Screen>
  );
}
