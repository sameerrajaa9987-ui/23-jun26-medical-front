import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, User, Phone, Mail } from "lucide-react-native";
import {
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
} from "@modules/customer/hooks/useCustomers";
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
} from "@shared/ui";

export default function CustomerFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string | undefined;
  const editing = Boolean(id);

  const { data: customer } = useCustomer(id || "");
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer(id || "");
  const mut = editing ? updateMut : createMut;

  const [f, setF] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    gstin: "",
  });

  useEffect(() => {
    if (customer)
      setF({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        gstin: customer.gstin,
      });
  }, [customer]);

  const set = (k: keyof typeof f) => (v: string) =>
    setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
    if (!f.name.trim()) return;
    mut.mutate(
      {
        name: f.name.trim(),
        mobile: f.mobile.trim() || undefined,
        email: f.email.trim() || undefined,
        address: f.address.trim() || undefined,
        gstin: f.gstin.trim() || undefined,
      },
      { onSuccess: () => navigation.goBack() },
    );
  };

  return (
    <Screen
      overline="Customers"
      title={editing ? "Edit customer" : "Add customer"}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={6}
        style={{ marginBottom: 16 }}
      >
        <HStack gap={6} align="center">
          <ArrowLeft size={18} color={palette.text.link} strokeWidth={2} />
          <Text variant="label" tone="link">
            Back
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
          <TextField
            label="Name"
            leading={
              <User size={18} color={palette.text.tertiary} strokeWidth={1.8} />
            }
            value={f.name}
            onChangeText={set("name")}
            placeholder="Customer name"
          />
          <TextField
            label="Mobile"
            leading={
              <Phone
                size={18}
                color={palette.text.tertiary}
                strokeWidth={1.8}
              />
            }
            value={f.mobile}
            onChangeText={set("mobile")}
            keyboardType="phone-pad"
            placeholder="9876543210"
          />
          <TextField
            label="Email (optional)"
            leading={
              <Mail size={18} color={palette.text.tertiary} strokeWidth={1.8} />
            }
            value={f.email}
            onChangeText={set("email")}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Address (optional)"
            value={f.address}
            onChangeText={set("address")}
            placeholder="Address"
          />
          <TextField
            label="GSTIN (optional, for B2B)"
            value={f.gstin}
            onChangeText={set("gstin")}
            autoCapitalize="characters"
          />
        </VStack>
      </Card>

      <Button
        label={editing ? "Save changes" : "Add customer"}
        size="lg"
        loading={mut.isPending}
        onPress={submit}
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
