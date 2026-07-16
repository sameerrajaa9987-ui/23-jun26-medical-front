import React, { useState } from "react";
import { View, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Camera,
  ImageIcon,
  FileText,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react-native";
import { ocrApi, ScanFile } from "@modules/inventory/api/ocrApi";
import { ScannedBill, ScannedLine } from "@modules/inventory/types";
import { apiErrorMessage } from "@api/apiClient";
import { palette, radius } from "@shared/designSystem";
import {
  Screen,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  StatusChip,
} from "@shared/ui";

/** "2028-01" -> "Jan 2028" for a quick human read. */
const prettyExpiry = (e: string | null) => {
  if (!e) return "—";
  const [y, m] = e.split("-");
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  return `${months[Number(m) - 1] || m} ${y}`;
};

export default function ScanBillScreen() {
  const navigation = useNavigation<never>();
  const nav = navigation as unknown as {
    navigate: (s: string, p?: object) => void;
    goBack: () => void;
  };
  const [preview, setPreview] = useState<string | null>(null);
  const [bill, setBill] = useState<ScannedBill | null>(null);

  const scan = useMutation({
    mutationFn: (file: ScanFile) => ocrApi.scanPurchaseBill(file),
    onSuccess: setBill,
  });

  const run = (file: ScanFile, previewUri: string | null) => {
    setBill(null);
    setPreview(previewUri);
    scan.mutate(file);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    run(
      {
        uri: a.uri,
        name: a.fileName || "bill.jpg",
        mimeType: a.mimeType || "image/jpeg",
      },
      a.uri,
    );
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    run(
      {
        uri: a.uri,
        name: a.fileName || "bill.jpg",
        mimeType: a.mimeType || "image/jpeg",
      },
      a.uri,
    );
  };

  const pickPdf = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    run(
      { uri: a.uri, name: a.name, mimeType: a.mimeType || "application/pdf" },
      a.mimeType?.startsWith("image/") ? a.uri : null,
    );
  };

  /** Hands the draft to Receive Stock, which pre-fills its form. */
  const useLines = () => {
    if (!bill) return;
    nav.navigate("ReceiveStock", { scanned: bill });
  };

  return (
    <Screen
      overline="Stock Inward"
      title="Scan a bill"
      subtitle="Photo, gallery or PDF — we read it, you confirm"
    >
      {/* Sources */}
      <Card style={{ marginBottom: 16 }}>
        <VStack gap={12}>
          <HStack gap={10} wrap>
            <Button
              label="Take photo"
              fullWidth={false}
              onPress={takePhoto}
              icon={<Camera size={17} color="#FFFFFF" strokeWidth={2} />}
            />
            <Button
              label="From gallery"
              variant="secondary"
              fullWidth={false}
              onPress={pickImage}
              icon={
                <ImageIcon
                  size={17}
                  color={palette.text.primary}
                  strokeWidth={2}
                />
              }
            />
            <Button
              label="PDF / file"
              variant="secondary"
              fullWidth={false}
              onPress={pickPdf}
              icon={
                <FileText
                  size={17}
                  color={palette.text.primary}
                  strokeWidth={2}
                />
              }
            />
          </HStack>
          <Text variant="caption" tone="tertiary">
            Lay the bill flat in good light. Sideways photos are fine — we
            detect the rotation.
          </Text>
        </VStack>
      </Card>

      {preview && (
        <Image
          source={{ uri: preview }}
          style={{
            width: "100%",
            height: 170,
            borderRadius: radius.lg,
            marginBottom: 16,
            backgroundColor: palette.ink[100],
          }}
          resizeMode="cover"
        />
      )}

      {scan.isPending && (
        <Card style={{ marginBottom: 16 }}>
          <HStack gap={12} align="center">
            <ActivityIndicator color={palette.teal[600]} />
            <VStack gap={2} flex={1}>
              <Text variant="label-lg" tone="primary">
                Reading the bill…
              </Text>
              <Text variant="caption" tone="tertiary">
                Two independent passes to cross-check every batch and expiry.
                Takes ~10–25 seconds.
              </Text>
            </VStack>
          </HStack>
        </Card>
      )}

      {scan.isError && (
        <View style={errBox}>
          <Text variant="body-sm" tone="danger">
            {apiErrorMessage(scan.error)}
          </Text>
        </View>
      )}

      {bill && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <VStack gap={10}>
              <Text variant="h3" tone="primary">
                {bill.supplierName || "Unknown supplier"}
              </Text>
              <Text variant="caption" tone="tertiary">
                {bill.invoiceNo
                  ? `Invoice ${bill.invoiceNo}`
                  : "No invoice no."}
                {bill.invoiceDate ? ` · ${bill.invoiceDate}` : ""}
              </Text>
              <HStack gap={8} wrap>
                <StatusChip
                  label={`${bill.stats.confident} ready`}
                  tone="success"
                />
                {bill.stats.needsReview > 0 && (
                  <StatusChip
                    label={`${bill.stats.needsReview} to check`}
                    tone="warning"
                  />
                )}
                <StatusChip label={`${bill.stats.total} lines`} tone="info" />
              </HStack>
              {bill.stats.needsReview > 0 && (
                <Text variant="caption" tone="tertiary">
                  Amber lines are where our two reads disagreed — check those
                  before saving. Everything else was confirmed twice.
                </Text>
              )}
            </VStack>
          </Card>

          <VStack gap={10}>
            {bill.lines.map((l, i) => (
              <LineCard key={i} line={l} />
            ))}
          </VStack>

          <Button
            label="Use these lines"
            size="lg"
            style={{ marginTop: 16 }}
            onPress={useLines}
            icon={<ArrowRight size={18} color="#FFFFFF" strokeWidth={2} />}
          />
          <Text
            variant="caption"
            tone="tertiary"
            align="center"
            style={{ marginTop: 8 }}
          >
            Nothing is saved yet — you&apos;ll confirm on the Receive Stock
            form.
          </Text>
        </>
      )}

      {!bill && !scan.isPending && !preview && (
        <Card>
          <VStack gap={8} align="center" style={{ paddingVertical: 20 }}>
            <ScanLine size={30} color={palette.teal[600]} strokeWidth={1.8} />
            <Text variant="label-lg" tone="primary">
              No bill scanned yet
            </Text>
            <Text variant="caption" tone="tertiary" align="center">
              Snap the distributor&apos;s invoice and we&apos;ll pull out every
              product, batch and expiry.
            </Text>
          </VStack>
        </Card>
      )}
    </Screen>
  );
}

function LineCard({ line }: { line: ScannedLine }) {
  const ok = !line.needsReview;
  return (
    <Card
      elevation="base"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: ok ? palette.success.text : palette.warning.text,
      }}
    >
      <VStack gap={8}>
        <HStack align="center" justify="space-between" gap={8}>
          <HStack gap={7} align="center" flex={1}>
            {ok ? (
              <CheckCircle2
                size={15}
                color={palette.success.text}
                strokeWidth={2.2}
              />
            ) : (
              <AlertTriangle
                size={15}
                color={palette.warning.text}
                strokeWidth={2.2}
              />
            )}
            <Text variant="label-lg" tone="primary" numberOfLines={1}>
              {line.productName || "Unreadable product"}
            </Text>
          </HStack>
          <Text variant="caption" tone="tertiary">
            {line.quantity ?? "—"} {line.pack || ""}
          </Text>
        </HStack>

        <HStack gap={6} wrap>
          <FieldChip
            label="Batch"
            value={line.batchNo}
            low={line.fields.batchNo.confidence === "low"}
            alt={line.fields.batchNo.alternative}
          />
          <FieldChip
            label="Exp"
            value={prettyExpiry(line.expiry)}
            low={line.fields.expiry.confidence === "low"}
            alt={line.fields.expiry.alternative}
          />
          {line.mrp != null && (
            <FieldChip
              label="MRP"
              value={`₹${line.mrp}`}
              low={line.fields.mrp.confidence === "low"}
              alt={null}
            />
          )}
        </HStack>

        {line.match ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            → {line.match.name} · {line.match.sku}
            {line.unitResolution?.resolved && line.unitResolution.factor
              ? ` · ${line.quantity ?? "?"} × ${line.unitResolution.unit} (${line.unitResolution.factor} ${line.match.baseUnit} each)`
              : ""}
          </Text>
        ) : (
          <Text variant="caption" tone="warning">
            Not matched to a product — you&apos;ll pick it on the next screen
          </Text>
        )}

        {/* The bill counts packs; if we couldn't prove which pack, say so. */}
        {line.match && !line.unitResolution?.resolved && (
          <Text variant="caption" tone="warning">
            {line.unitResolution?.reason || "Unit unclear — choose it next"}
          </Text>
        )}

        {/* Resolved, but the bill sells multi-packs — worth a glance. */}
        {line.unitResolution?.note && (
          <Text variant="caption" tone="tertiary">
            {line.unitResolution.note}
          </Text>
        )}

        {line.freeQty > 0 && (
          <Text variant="caption" tone="warning">
            +{line.freeQty} free on this bill — add them if you&apos;re stocking
            them
          </Text>
        )}
      </VStack>
    </Card>
  );
}

function FieldChip({
  label,
  value,
  low,
  alt,
}: {
  label: string;
  value: string | number | null;
  low: boolean;
  alt: string | number | null;
}) {
  return (
    <View style={[chip, low ? chipLow : chipOk]}>
      <Text
        variant="label-sm"
        style={{ color: low ? palette.warning.text : palette.success.text }}
      >
        {label}: {value ?? "—"}
        {low && alt ? `  (or ${alt}?)` : ""}
      </Text>
    </View>
  );
}

const chip = {
  paddingHorizontal: 9,
  paddingVertical: 4,
  borderRadius: radius.full,
  borderWidth: 1,
} as const;
const chipOk = {
  backgroundColor: palette.success.bg,
  borderColor: palette.success.border,
} as const;
const chipLow = {
  backgroundColor: palette.warning.bg,
  borderColor: palette.warning.border,
} as const;
const errBox = {
  padding: 14,
  borderRadius: radius.md,
  backgroundColor: palette.danger.bg,
  borderWidth: 1,
  borderColor: palette.danger.border,
  marginBottom: 16,
} as const;
