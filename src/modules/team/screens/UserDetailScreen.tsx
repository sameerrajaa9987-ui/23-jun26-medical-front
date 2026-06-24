import React, { useState, useEffect } from "react";
import { View, Pressable, Switch, Alert, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, ShieldCheck, KeyRound, Trash2 } from "lucide-react-native";
import {
  useTeamUser,
  usePermissionCatalogue,
  useUpdatePermissions,
  useSetActive,
  useResetUserPassword,
  useRemoveUser,
} from "@modules/team/hooks/useTeam";
import { apiErrorMessage } from "@api/apiClient";
import { palette, radius } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Avatar,
  Button,
  TextField,
  ChipsRow,
  StatusChip,
} from "@shared/ui";
import { PermissionEditor } from "@modules/team/components/PermissionEditor";

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (window.confirm(message)) onYes();
  } else {
    Alert.alert("Please confirm", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: onYes },
    ]);
  }
}

export default function UserDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string;

  const { data: user } = useTeamUser(id);
  const { data: catalogue } = usePermissionCatalogue();
  const updateMut = useUpdatePermissions(id);
  const activeMut = useSetActive(id);
  const resetMut = useResetUserPassword(id);
  const removeMut = useRemoveUser();

  const [roleLabel, setRoleLabel] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      setRoleLabel(user.roleLabel || "");
      setPermissions(user.permissions || []);
    }
  }, [user]);

  if (!user) {
    return (
      <Screen title="Member">
        <Text tone="tertiary">Loading…</Text>
      </Screen>
    );
  }

  const isAdmin = user.role === "admin";
  const labelChips = (catalogue?.suggestedLabels || []).map((l) => ({
    key: l,
    label: l,
  }));
  const toggle = (key: string) =>
    setPermissions((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );

  return (
    <Screen overline="Team member" title={user.fullName} subtitle={user.email}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={6}
        style={{ marginBottom: 16 }}
      >
        <HStack gap={6} align="center">
          <ArrowLeft size={18} color={palette.text.link} strokeWidth={2} />
          <Text variant="label" tone="link">
            Back to team
          </Text>
        </HStack>
      </Pressable>

      <Card style={{ marginBottom: 16 }}>
        <HStack gap={14} align="center">
          <Avatar
            name={user.fullName}
            size={54}
            tone={isAdmin ? "cobalt" : "teal"}
          />
          <VStack gap={4} flex={1}>
            <HStack gap={8} align="center">
              <Text variant="h3" tone="primary">
                {user.fullName}
              </Text>
              {isAdmin && (
                <ShieldCheck
                  size={16}
                  color={palette.cobalt[600]}
                  strokeWidth={2}
                />
              )}
            </HStack>
            <HStack gap={6} wrap>
              <StatusChip
                label={isAdmin ? "Admin" : user.roleLabel || "Staff"}
                tone={isAdmin ? "info" : "neutral"}
              />
              <StatusChip
                label={user.isActive ? "Active" : "Disabled"}
                tone={user.isActive ? "success" : "danger"}
              />
            </HStack>
          </VStack>
        </HStack>
      </Card>

      {isAdmin ? (
        <Card>
          <VStack gap={8} align="center">
            <ShieldCheck
              size={28}
              color={palette.cobalt[600]}
              strokeWidth={1.8}
            />
            <Text variant="label-lg" tone="primary" align="center">
              This is the workspace Admin
            </Text>
            <Text variant="body-sm" tone="tertiary" align="center">
              The Admin always holds every permission and cannot be edited,
              disabled or removed.
            </Text>
          </VStack>
        </Card>
      ) : (
        <>
          {updateMut.isError && (
            <View style={errorBox}>
              <Text variant="body-sm" tone="danger">
                {apiErrorMessage(updateMut.error)}
              </Text>
            </View>
          )}

          {/* Active toggle */}
          <Card style={{ marginBottom: 16 }}>
            <HStack align="center" justify="space-between">
              <VStack gap={2} flex={1}>
                <Text variant="label-lg" tone="primary">
                  Account active
                </Text>
                <Text variant="body-sm" tone="tertiary">
                  Disabled members cannot sign in.
                </Text>
              </VStack>
              <Switch
                value={user.isActive}
                onValueChange={(v) => activeMut.mutate(v)}
                trackColor={{
                  true: palette.teal[500],
                  false: palette.ink[200],
                }}
                thumbColor="#FFFFFF"
              />
            </HStack>
          </Card>

          {/* Role label */}
          <Card style={{ marginBottom: 16 }}>
            <Text variant="label" tone="secondary" style={{ marginBottom: 8 }}>
              Role label
            </Text>
            <ChipsRow
              chips={labelChips}
              active={roleLabel}
              onChange={setRoleLabel}
            />
          </Card>

          {/* Permissions */}
          <Text variant="h3" tone="primary" style={{ marginBottom: 12 }}>
            Permissions
          </Text>
          <Card style={{ marginBottom: 16 }}>
            <PermissionEditor
              available={catalogue?.permissions || []}
              selected={permissions}
              onToggle={toggle}
            />
          </Card>

          <Button
            label="Save changes"
            size="lg"
            loading={updateMut.isPending}
            onPress={() => updateMut.mutate({ roleLabel, permissions })}
            style={{ marginBottom: 24 }}
          />

          {/* Admin reset password */}
          <Text variant="h3" tone="primary" style={{ marginBottom: 12 }}>
            Security
          </Text>
          <Card style={{ marginBottom: 16 }}>
            <VStack gap={12}>
              <TextField
                label="Reset password"
                leading={
                  <KeyRound
                    size={18}
                    color={palette.text.tertiary}
                    strokeWidth={1.8}
                  />
                }
                placeholder="New temporary password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              {resetMut.isSuccess && (
                <Text variant="caption" tone="success">
                  Password reset. Share the new password with the member.
                </Text>
              )}
              <Button
                label="Reset password"
                variant="secondary"
                disabled={newPassword.length < 6}
                loading={resetMut.isPending}
                onPress={() =>
                  resetMut.mutate(newPassword, {
                    onSuccess: () => setNewPassword(""),
                  })
                }
              />
            </VStack>
          </Card>

          {/* Remove */}
          <Card>
            <HStack align="center" justify="space-between">
              <VStack gap={2} flex={1}>
                <Text variant="label-lg" tone="primary">
                  Remove member
                </Text>
                <Text variant="body-sm" tone="tertiary">
                  Deactivates the account; history is preserved.
                </Text>
              </VStack>
              <Button
                label="Remove"
                variant="destructive"
                fullWidth={false}
                icon={<Trash2 size={16} color="#FFFFFF" strokeWidth={2} />}
                loading={removeMut.isPending}
                onPress={() =>
                  confirm(`Remove ${user.fullName}?`, () =>
                    removeMut.mutate(id, {
                      onSuccess: () => navigation.goBack(),
                    }),
                  )
                }
              />
            </HStack>
          </Card>
        </>
      )}
    </Screen>
  );
}

const errorBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.danger.bg,
  borderWidth: 1,
  borderColor: palette.danger.border,
  marginBottom: 16,
} as const;
