import React, { useEffect, useState } from "react";
import { View, Pressable, Switch, Platform, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useRemoveProduct,
  useCategories,
  useBrands,
  useCreateCategory,
  useCreateBrand,
} from "@modules/product/hooks/useProducts";
import { PackUnit, ScheduleDrug } from "@modules/product/types";
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
  Select,
} from "@shared/ui";
import { PacksEditor } from "@modules/product/components/PacksEditor";

const SCHEDULES: { value: ScheduleDrug; label: string }[] = [
  { value: "", label: "None" },
  { value: "H", label: "Schedule H" },
  { value: "H1", label: "Schedule H1" },
  { value: "X", label: "Schedule X" },
  { value: "G", label: "Schedule G" },
  { value: "C", label: "Schedule C" },
];

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

export default function ProductFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id as string | undefined;
  const editing = Boolean(id);

  const { data: product } = useProduct(id || "");
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const createCategory = useCreateCategory();
  const createBrand = useCreateBrand();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct(id || "");
  const removeMut = useRemoveProduct();
  const mut = editing ? updateMut : createMut;

  const [f, setF] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: null as string | null,
    brandId: null as string | null,
    baseUnit: "pcs",
    packs: [] as PackUnit[],
    sellingPrice: "",
    mrp: "",
    taxRatePct: "",
    hsnCode: "",
    reorderLevel: "",
    prescriptionRequired: false,
    scheduleDrug: "" as ScheduleDrug,
  });

  useEffect(() => {
    if (product) {
      setF({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        categoryId: product.categoryId,
        brandId: product.brandId,
        baseUnit: product.baseUnit,
        packs: product.packs,
        sellingPrice: String(product.sellingPrice),
        mrp: String(product.mrp),
        taxRatePct: String(product.taxRatePct),
        hsnCode: product.hsnCode,
        reorderLevel: String(product.reorderLevel),
        prescriptionRequired: product.prescriptionRequired,
        scheduleDrug: product.scheduleDrug,
      });
    }
  }, [product]);

  const set = (k: keyof typeof f) => (v: string) =>
    setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
    if (!f.name.trim()) return;
    const payload = {
      name: f.name.trim(),
      sku: f.sku.trim() || undefined,
      barcode: f.barcode.trim() || undefined,
      categoryId: f.categoryId,
      brandId: f.brandId,
      baseUnit: f.baseUnit.trim() || "pcs",
      packs: f.packs.filter((p) => p.unit.trim() && p.factor > 0),
      sellingPrice: Number(f.sellingPrice) || 0,
      mrp: Number(f.mrp) || 0,
      taxRatePct: f.taxRatePct === "" ? undefined : Number(f.taxRatePct),
      hsnCode: f.hsnCode.trim(),
      reorderLevel: f.reorderLevel === "" ? undefined : Number(f.reorderLevel),
      prescriptionRequired: f.prescriptionRequired,
      scheduleDrug: f.scheduleDrug,
    };
    mut.mutate(payload as never, { onSuccess: () => navigation.goBack() });
  };

  const categoryOptions = (categories || []).map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const brandOptions = (brands || []).map((b) => ({
    value: b.id,
    label: b.name,
  }));

  return (
    <Screen
      overline="Catalogue"
      title={editing ? "Edit product" : "Add product"}
      subtitle={editing ? product?.sku : "Define a catalogue item"}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={6}
        style={{ marginBottom: 16 }}
      >
        <HStack gap={6} align="center">
          <ArrowLeft size={18} color={palette.text.link} strokeWidth={2} />
          <Text variant="label" tone="link">
            Back to products
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

      {/* Identity */}
      <Card style={{ marginBottom: 16 }}>
        <VStack gap={16}>
          <TextField
            label="Product name"
            value={f.name}
            onChangeText={set("name")}
            placeholder="Amoxicillin 500mg"
          />
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="SKU"
                value={f.sku}
                onChangeText={set("sku")}
                placeholder="Auto-generated"
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Barcode"
                value={f.barcode}
                onChangeText={set("barcode")}
                placeholder="EAN / UPC"
                keyboardType="number-pad"
              />
            </View>
          </HStack>
          <Select
            label="Category"
            value={f.categoryId}
            options={categoryOptions}
            onChange={(v) => setF((s) => ({ ...s, categoryId: v }))}
            onCreate={async (label) => {
              const cat = await createCategory.mutateAsync(label);
              return { value: cat.id, label: cat.name };
            }}
            allowClear
          />
          <Select
            label="Brand"
            value={f.brandId}
            options={brandOptions}
            onChange={(v) => setF((s) => ({ ...s, brandId: v }))}
            onCreate={async (label) => {
              const b = await createBrand.mutateAsync(label);
              return { value: b.id, label: b.name };
            }}
            allowClear
          />
        </VStack>
      </Card>

      {/* Units */}
      <Text variant="h3" tone="primary" style={{ marginBottom: 12 }}>
        Units of measure
      </Text>
      <Card style={{ marginBottom: 16 }}>
        <VStack gap={16}>
          <TextField
            label="Base unit"
            value={f.baseUnit}
            onChangeText={set("baseUnit")}
            placeholder="tablet / pcs / ml"
          />
          <PacksEditor
            baseUnit={f.baseUnit}
            packs={f.packs}
            onChange={(packs) => setF((s) => ({ ...s, packs }))}
          />
        </VStack>
      </Card>

      {/* Pricing */}
      <Text variant="h3" tone="primary" style={{ marginBottom: 12 }}>
        Pricing & tax
      </Text>
      <Card style={{ marginBottom: 16 }}>
        <VStack gap={16}>
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Selling price (₹)"
                value={f.sellingPrice}
                onChangeText={set("sellingPrice")}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="MRP (₹)"
                value={f.mrp}
                onChangeText={set("mrp")}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          </HStack>
          <HStack gap={12}>
            <View style={{ flex: 1 }}>
              <TextField
                label="GST %"
                value={f.taxRatePct}
                onChangeText={set("taxRatePct")}
                keyboardType="decimal-pad"
                placeholder="from settings"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="HSN code"
                value={f.hsnCode}
                onChangeText={set("hsnCode")}
                placeholder="3004"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                label="Reorder level"
                value={f.reorderLevel}
                onChangeText={set("reorderLevel")}
                keyboardType="number-pad"
                placeholder="from settings"
              />
            </View>
          </HStack>
        </VStack>
      </Card>

      {/* Pharma */}
      <Text variant="h3" tone="primary" style={{ marginBottom: 12 }}>
        Pharmacy
      </Text>
      <Card style={{ marginBottom: 20 }}>
        <VStack gap={16}>
          <HStack align="center" justify="space-between">
            <VStack gap={2} flex={1}>
              <Text variant="label-lg" tone="primary">
                Prescription required
              </Text>
              <Text variant="body-sm" tone="tertiary">
                Warn at point of sale (Rx / Schedule drugs).
              </Text>
            </VStack>
            <Switch
              value={f.prescriptionRequired}
              onValueChange={(v) =>
                setF((s) => ({ ...s, prescriptionRequired: v }))
              }
              trackColor={{ true: palette.teal[500], false: palette.ink[200] }}
              thumbColor="#FFFFFF"
            />
          </HStack>
          <Select
            label="Drug schedule"
            value={f.scheduleDrug}
            options={SCHEDULES.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(v) =>
              setF((s) => ({ ...s, scheduleDrug: (v || "") as ScheduleDrug }))
            }
          />
        </VStack>
      </Card>

      <Button
        label={editing ? "Save changes" : "Create product"}
        size="lg"
        loading={mut.isPending}
        onPress={submit}
      />

      {editing && product?.isActive && (
        <Button
          label="Deactivate product"
          variant="destructive"
          icon={<Trash2 size={16} color="#FFFFFF" strokeWidth={2} />}
          style={{ marginTop: 12 }}
          loading={removeMut.isPending}
          onPress={() =>
            confirm("Deactivate this product? History is preserved.", () =>
              removeMut.mutate(id!, { onSuccess: () => navigation.goBack() }),
            )
          }
        />
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
