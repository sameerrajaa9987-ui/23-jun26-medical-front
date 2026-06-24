import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useLogin } from "@modules/auth/hooks/useAuth";
import { apiErrorMessage } from "@api/apiClient";
import { palette, radius } from "@shared/designSystem";
import { Text, VStack, HStack, Button, TextField } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";

type Nav = { navigate: (s: string) => void };

export default function LoginScreen({ navigation }: { navigation: Nav }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const mut = useLogin();

  const submit = () => {
    if (!email || !password) return;
    mut.mutate({ email: email.trim(), password });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your MedStock workspace"
    >
      <VStack gap={16}>
        {mut.isError && (
          <View style={errorBox}>
            <Text variant="body-sm" tone="danger">
              {apiErrorMessage(mut.error, "Invalid email or password")}
            </Text>
          </View>
        )}

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
          onSubmitEditing={submit}
        />
        <TextField
          label="Password"
          leading={
            <Lock size={18} color={palette.text.tertiary} strokeWidth={1.8} />
          }
          placeholder="••••••••"
          secureTextEntry={!show}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
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
        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          hitSlop={6}
        >
          <Text variant="label" tone="link" align="right">
            Forgot password?
          </Text>
        </Pressable>

        <Button
          label="Sign in"
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
            New to MedStock?
          </Text>
          <Pressable onPress={() => navigation.navigate("Signup")} hitSlop={6}>
            <Text variant="label" tone="link">
              Create a workspace
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
