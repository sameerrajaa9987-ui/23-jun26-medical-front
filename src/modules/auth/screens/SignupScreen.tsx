import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Building2, Mail, Lock, User, Eye, EyeOff } from "lucide-react-native";
import { useSignup } from "@modules/auth/hooks/useAuth";
import { apiErrorMessage } from "@api/apiClient";
import { palette, radius } from "@shared/designSystem";
import { Text, VStack, HStack, Button, TextField, ChipsRow } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";

type Nav = { navigate: (s: string) => void };

const INDUSTRIES = [
  { key: "pharmacy", label: "Pharmacy" },
  { key: "medical", label: "Medical Store" },
  { key: "hospital", label: "Hospital" },
  { key: "fmcg", label: "FMCG" },
  { key: "grocery", label: "Grocery" },
  { key: "spare_parts", label: "Spare Parts" },
  { key: "other", label: "Other" },
];

export default function SignupScreen({ navigation }: { navigation: Nav }) {
  const [organizationName, setOrg] = useState("");
  const [industry, setIndustry] = useState("pharmacy");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const mut = useSignup();

  const submit = () => {
    if (!organizationName || !firstName || !email || !password) return;
    mut.mutate({
      organizationName: organizationName.trim(),
      industry,
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim(),
      password,
    });
  };

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="You'll be the Admin — invite your team after sign-up"
    >
      <VStack gap={16}>
        {mut.isError && (
          <View style={errorBox}>
            <Text variant="body-sm" tone="danger">
              {apiErrorMessage(mut.error, "Could not create workspace")}
            </Text>
          </View>
        )}

        <TextField
          label="Company / Store name"
          leading={
            <Building2
              size={18}
              color={palette.text.tertiary}
              strokeWidth={1.8}
            />
          }
          placeholder="Acme Pharmacy"
          value={organizationName}
          onChangeText={setOrg}
        />

        <View>
          <Text variant="label" tone="secondary" style={{ marginBottom: 8 }}>
            Industry
          </Text>
          <ChipsRow
            chips={INDUSTRIES}
            active={industry}
            onChange={setIndustry}
          />
        </View>

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
              placeholder="Aisha"
              value={firstName}
              onChangeText={setFirst}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label="Last name"
              placeholder="Khan"
              value={lastName}
              onChangeText={setLast}
            />
          </View>
        </HStack>

        <TextField
          label="Email"
          leading={
            <Mail size={18} color={palette.text.tertiary} strokeWidth={1.8} />
          }
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          leading={
            <Lock size={18} color={palette.text.tertiary} strokeWidth={1.8} />
          }
          placeholder="At least 6 characters"
          secureTextEntry={!show}
          value={password}
          onChangeText={setPassword}
          trailing={
            <Pressable hitSlop={10} onPress={() => setShow((s) => !s)}>
              {show ? (
                <EyeOff
                  size={18}
                  color={palette.text.tertiary}
                  strokeWidth={1.8}
                />
              ) : (
                <Eye
                  size={18}
                  color={palette.text.tertiary}
                  strokeWidth={1.8}
                />
              )}
            </Pressable>
          }
        />

        <Button
          label="Create workspace"
          onPress={submit}
          loading={mut.isPending}
          size="lg"
        />

        <HStack
          justify="center"
          align="center"
          gap={5}
          style={{ marginTop: 8 }}
        >
          <Text variant="body-sm" tone="tertiary">
            Already have an account?
          </Text>
          <Pressable onPress={() => navigation.navigate("Login")} hitSlop={6}>
            <Text variant="label" tone="link">
              Sign in
            </Text>
          </Pressable>
        </HStack>
      </VStack>
    </AuthLayout>
  );
}

const errorBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.danger.bg,
  borderWidth: 1,
  borderColor: palette.danger.border,
} as const;
