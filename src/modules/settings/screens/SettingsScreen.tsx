import React, { useEffect, useState } from "react";
import { View, Switch } from "react-native";
import { Building2, Receipt, BellRing } from "lucide-react-native";
import {
  useSettings,
  useUpdateSettings,
} from "@modules/settings/hooks/useSettings";
import { useAuthStore } from "@shared/store/useAuthStore";
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
  StatusChip,
} from "@shared/ui";

export default function SettingsScreen() {
  const { data, isLoading, refetch, isRefetching } = useSettings();
  const mut = useUpdateSettings();
  const org = useAuthStore((s) => s.organization);

  const [company, setCompany] = useState({
    legalName: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    drugLicenseNo: "",
    gstin: "",
  });
  const [tax, setTax] = useState({
    enabled: true,
    defaultRatePct: "12",
    invoicePrefix: "INV",
    priceIncludesTax: false,
  });
  const [channels, setChannels] = useState({
    inApp: true,
    email: false,
    sms: false,
  });

  useEffect(() => {
    if (data) {
      setCompany({
        legalName: data.company.legalName,
        addressLine1: data.company.addressLine1,
        city: data.company.city,
        state: data.company.state,
        pincode: data.company.pincode,
        phone: data.company.phone,
        email: data.company.email,
        drugLicenseNo: data.company.drugLicenseNo,
        gstin: data.company.gstin,
      });
      setTax({
        enabled: data.tax.enabled,
        defaultRatePct: String(data.tax.defaultRatePct),
        invoicePrefix: data.tax.invoicePrefix,
        priceIncludesTax: data.tax.priceIncludesTax,
      });
      setChannels(data.alertChannels);
    }
  }, [data]);

  const save = () =>
    mut.mutate({
      company,
      tax: {
        enabled: tax.enabled,
        defaultRatePct: Number(tax.defaultRatePct) || 0,
        invoicePrefix: tax.invoicePrefix,
        priceIncludesTax: tax.priceIncludesTax,
      },
      alertChannels: channels,
    });

  const set = (k: keyof typeof company) => (v: string) =>
    setCompany((c) => ({ ...c, [k]: v }));

  return (
    <Screen
      overline="Administration"
      title="Settings"
      subtitle={
        org?.name
          ? `${org.name} · company & invoice configuration`
          : "Configuration"
      }
      refreshing={isRefetching || isLoading}
      onRefresh={refetch}
      right={
        <Button
          label="Save"
          fullWidth={false}
          loading={mut.isPending}
          onPress={save}
        />
      }
    >
      {mut.isError && (
        <View style={errorBox}>
          <Text variant="body-sm" tone="danger">
            {apiErrorMessage(mut.error)}
          </Text>
        </View>
      )}
      {mut.isSuccess && (
        <View style={okBox}>
          <Text variant="body-sm" tone="success">
            Settings saved.
          </Text>
        </View>
      )}

      {/* Company profile */}
      <SectionHeader
        icon={Building2}
        title="Company & invoice header"
        subtitle="Printed on every invoice"
      />
      <Card style={{ marginBottom: 24 }}>
        <VStack gap={16}>
          <TextField
            label="Legal name"
            value={company.legalName}
            onChangeText={set("legalName")}
            placeholder="Acme Pharmacy Pvt Ltd"
          />
          <TextField
            label="Address"
            value={company.addressLine1}
            onChangeText={set("addressLine1")}
            placeholder="Street, area"
          />
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="City"
                value={company.city}
                onChangeText={set("city")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="State"
                value={company.state}
                onChangeText={set("state")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="PIN"
                value={company.pincode}
                onChangeText={set("pincode")}
                keyboardType="number-pad"
              />
            </View>
          </HStack>
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Phone"
                value={company.phone}
                onChangeText={set("phone")}
                keyboardType="phone-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Email"
                value={company.email}
                onChangeText={set("email")}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </HStack>
          <HStack gap={12} align="center">
            <View style={{ flex: 1 }}>
              <TextField
                label="Drug license no."
                value={company.drugLicenseNo}
                onChangeText={set("drugLicenseNo")}
                placeholder="MH-PH-…"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="GSTIN"
                value={company.gstin}
                onChangeText={set("gstin")}
                autoCapitalize="characters"
              />
            </View>
          </HStack>
        </VStack>
      </Card>

      {/* Tax / GST */}
      <SectionHeader
        icon={Receipt}
        title="Tax & GST"
        subtitle="Used to compute invoice totals (SOW §9.1)"
      />
      <Card style={{ marginBottom: 24 }}>
        <VStack gap={16}>
          <HStack align="center" justify="space-between">
            <Text variant="label-lg" tone="primary">
              GST enabled
            </Text>
            <Switch
              value={tax.enabled}
              onValueChange={(v) => setTax((t) => ({ ...t, enabled: v }))}
              trackColor={{ true: palette.teal[500], false: palette.ink[200] }}
              thumbColor="#FFFFFF"
            />
          </HStack>
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Default GST rate (%)"
                value={tax.defaultRatePct}
                onChangeText={(v) =>
                  setTax((t) => ({ ...t, defaultRatePct: v }))
                }
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Invoice prefix"
                value={tax.invoicePrefix}
                onChangeText={(v) =>
                  setTax((t) => ({ ...t, invoicePrefix: v }))
                }
                autoCapitalize="characters"
              />
            </View>
          </HStack>
          <HStack align="center" justify="space-between">
            <VStack gap={2} flex={1}>
              <Text variant="label-lg" tone="primary">
                Prices include tax
              </Text>
              <Text variant="body-sm" tone="tertiary">
                If on, selling prices are treated as tax-inclusive.
              </Text>
            </VStack>
            <Switch
              value={tax.priceIncludesTax}
              onValueChange={(v) =>
                setTax((t) => ({ ...t, priceIncludesTax: v }))
              }
              trackColor={{ true: palette.teal[500], false: palette.ink[200] }}
              thumbColor="#FFFFFF"
            />
          </HStack>
        </VStack>
      </Card>

      {/* Expiry alerts */}
      <SectionHeader
        icon={BellRing}
        title="Expiry alerts"
        subtitle="Thresholds (days) and delivery channels"
      />
      <Card style={{ marginBottom: 24 }}>
        <VStack gap={16}>
          <HStack gap={8} wrap>
            {(data?.expiryAlertDays || [90, 60, 30]).map((d) => (
              <StatusChip key={d} label={`${d} days`} tone="info" />
            ))}
          </HStack>
          {(["inApp", "email", "sms"] as const).map((ch) => (
            <HStack key={ch} align="center" justify="space-between">
              <Text variant="label-lg" tone="primary">
                {ch === "inApp"
                  ? "In-app alerts"
                  : ch === "email"
                    ? "Email alerts"
                    : "SMS alerts"}
              </Text>
              <Switch
                value={channels[ch]}
                onValueChange={(v) => setChannels((c) => ({ ...c, [ch]: v }))}
                trackColor={{
                  true: palette.teal[500],
                  false: palette.ink[200],
                }}
                thumbColor="#FFFFFF"
              />
            </HStack>
          ))}
        </VStack>
      </Card>

      <Button
        label="Save settings"
        size="lg"
        loading={mut.isPending}
        onPress={save}
      />
    </Screen>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <HStack gap={12} align="center" style={{ marginBottom: 12 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: palette.teal[50],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={palette.teal[600]} strokeWidth={2} />
      </View>
      <VStack gap={1} flex={1}>
        <Text variant="h3" tone="primary">
          {title}
        </Text>
        <Text variant="caption" tone="tertiary">
          {subtitle}
        </Text>
      </VStack>
    </HStack>
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
const okBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.success.bg,
  borderWidth: 1,
  borderColor: palette.success.border,
  marginBottom: 16,
} as const;
