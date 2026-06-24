import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, User, Mail, Phone, Lock } from "lucide-react-native";
import {
  useCreateUser,
  usePermissionCatalogue,
} from "@modules/team/hooks/useTeam";
import { apiErrorMessage } from "@api/apiClient";
import { palette, radius } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  TextField,
  ChipsRow,
} from "@shared/ui";
import { PermissionEditor } from "@modules/team/components/PermissionEditor";

export default function AddUserScreen() {
  const navigation = useNavigation<any>();
  const { data: catalogue } = usePermissionCatalogue();
  const mut = useCreateUser();

  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const labelChips = (catalogue?.suggestedLabels || []).map((l) => ({
    key: l,
    label: l,
  }));

  const toggle = (key: string) =>
    setPermissions((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );

  const submit = () => {
    if (!firstName || !email || !password) return;
    mut.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        roleLabel: roleLabel || undefined,
        permissions,
      },
      { onSuccess: () => navigation.goBack() },
    );
  };

  return (
    <Screen
      overline="Team"
      title="Add member"
      subtitle="Create a staff account and grant permissions"
    >
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

      {mut.isError && (
        <View style={errorBox}>
          <Text variant="body-sm" tone="danger">
            {apiErrorMessage(mut.error)}
          </Text>
        </View>
      )}

      <Card style={{ marginBottom: 16 }}>
        <VStack gap={16}>
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="First name"
                leading={
                  <User
                    size={18}
                    color={palette.text.tertiary}
                    strokeWidth={1.8}
                  />
                }
                value={firstName}
                onChangeText={setFirst}
                placeholder="Ravi"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Last name"
                value={lastName}
                onChangeText={setLast}
                placeholder="Sharma"
              />
            </View>
          </HStack>
          <TextField
            label="Email"
            leading={
              <Mail size={18} color={palette.text.tertiary} strokeWidth={1.8} />
            }
            value={email}
            onChangeText={setEmail}
            placeholder="ravi@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Phone (optional)"
            leading={
              <Phone
                size={18}
                color={palette.text.tertiary}
                strokeWidth={1.8}
              />
            }
            value={phone}
            onChangeText={setPhone}
            placeholder="+91…"
            keyboardType="phone-pad"
          />
          <TextField
            label="Temporary password"
            leading={
              <Lock size={18} color={palette.text.tertiary} strokeWidth={1.8} />
            }
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          <View>
            <Text variant="label" tone="secondary" style={{ marginBottom: 8 }}>
              Role label (display only)
            </Text>
            <ChipsRow
              chips={labelChips}
              active={roleLabel}
              onChange={setRoleLabel}
            />
          </View>
        </VStack>
      </Card>

      <Text variant="h3" tone="primary" style={{ marginBottom: 6 }}>
        Permissions
      </Text>
      <Text variant="body-sm" tone="tertiary" style={{ marginBottom: 16 }}>
        Access is controlled entirely by what you select here — the role label
        grants nothing.
      </Text>
      <Card style={{ marginBottom: 20 }}>
        <PermissionEditor
          available={catalogue?.permissions || []}
          selected={permissions}
          onToggle={toggle}
        />
      </Card>

      <Button
        label="Create member"
        onPress={submit}
        loading={mut.isPending}
        size="lg"
      />
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
