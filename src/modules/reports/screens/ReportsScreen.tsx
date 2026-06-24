import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { FileSpreadsheet, FileText, BarChart3 } from "lucide-react-native";
import {
  useReport,
  useDownloadReport,
} from "@modules/reports/hooks/useReports";
import { ReportType, ReportColumn } from "@modules/reports/api/reportsApi";
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
  EmptyState,
} from "@shared/ui";

const TYPES: { key: ReportType; label: string; timed: boolean }[] = [
  { key: "inventory", label: "Inventory", timed: false },
  { key: "sales", label: "Sales", timed: true },
  { key: "expiry", label: "Expiry", timed: false },
  { key: "batch", label: "Batch", timed: false },
  { key: "stock-movement", label: "Stock movement", timed: true },
  { key: "warehouse", label: "Warehouse", timed: false },
  { key: "purchase", label: "Purchase", timed: true },
  { key: "user-activity", label: "User activity", timed: true },
];

const money = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function fmt(value: unknown, col: ReportColumn) {
  if (value == null || value === "") return "—";
  if (col.type === "money") return money(Number(value));
  if (col.type === "number") return String(value);
  if (col.type === "date")
    return new Date(value as string).toISOString().slice(0, 10);
  return String(value);
}

export default function ReportsScreen() {
  const [type, setType] = useState<ReportType>("inventory");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const meta = TYPES.find((t) => t.key === type)!;
  const params = { from: from.trim() || undefined, to: to.trim() || undefined };
  const { data, isLoading, isError, error, refetch, isRefetching } = useReport(
    type,
    params,
  );
  const download = useDownloadReport();

  return (
    <Screen
      overline="Insights"
      title="Reports"
      subtitle="Filter, view and export to Excel or PDF"
      refreshing={isRefetching}
      onRefresh={refetch}
    >
      {/* Type selector */}
      <View style={{ marginHorizontal: -24, marginBottom: 16 }}>
        <ChipsRow
          chips={TYPES.map((t) => ({ key: t.key, label: t.label }))}
          active={type}
          onChange={(k) => setType(k as ReportType)}
        />
      </View>

      {/* Date range (timed reports) + exports */}
      <Card style={{ marginBottom: 16 }}>
        <VStack gap={14}>
          {meta.timed && (
            <HStack gap={12}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="From"
                  value={from}
                  onChangeText={setFrom}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="To"
                  value={to}
                  onChangeText={setTo}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                />
              </View>
            </HStack>
          )}
          <HStack gap={10} wrap>
            <Button
              label="Export Excel"
              variant="secondary"
              fullWidth={false}
              icon={
                <FileSpreadsheet
                  size={16}
                  color={palette.teal[600]}
                  strokeWidth={2}
                />
              }
              loading={
                download.isPending && download.variables?.format === "excel"
              }
              onPress={() => download.mutate({ type, format: "excel", params })}
            />
            <Button
              label="Export PDF"
              variant="secondary"
              fullWidth={false}
              icon={
                <FileText
                  size={16}
                  color={palette.cobalt[600]}
                  strokeWidth={2}
                />
              }
              loading={
                download.isPending && download.variables?.format === "pdf"
              }
              onPress={() => download.mutate({ type, format: "pdf", params })}
            />
          </HStack>
          {download.isError && (
            <Text variant="caption" tone="danger">
              {apiErrorMessage(download.error, "Export failed")}
            </Text>
          )}
        </VStack>
      </Card>

      {/* Summary */}
      {data?.summary && (
        <Card style={{ marginBottom: 16 }}>
          <HStack gap={20} wrap>
            {Object.entries(data.summary).map(([k, v]) => (
              <VStack key={k} gap={2}>
                <Text variant="caption" tone="tertiary">
                  {k}
                </Text>
                <Text variant="h3" tone="primary">
                  {typeof v === "number" &&
                  k.toLowerCase().match(/value|total|tax|taxable/)
                    ? money(v)
                    : String(v)}
                </Text>
              </VStack>
            ))}
          </HStack>
        </Card>
      )}

      {/* Table */}
      {isError ? (
        <EmptyState
          icon={BarChart3}
          title="Couldn't load report"
          message={apiErrorMessage(error)}
        />
      ) : !data || data.rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={isLoading ? "Loading…" : "No data"}
          message="No records for this report or date range."
        />
      ) : (
        <Card padded={false} style={{ overflow: "hidden" }}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* header */}
              <View style={[styles.row, styles.headerRow]}>
                {data.columns.map((c) => (
                  <View
                    key={c.key}
                    style={[styles.cell, { width: colWidth(c) }]}
                  >
                    <Text
                      variant="label-sm"
                      style={{ color: "#FFFFFF" }}
                      numberOfLines={1}
                    >
                      {c.label}
                    </Text>
                  </View>
                ))}
              </View>
              {/* rows */}
              {data.rows.slice(0, 200).map((row, ri) => (
                <View
                  key={ri}
                  style={[
                    styles.row,
                    ri % 2 === 1 && {
                      backgroundColor: palette.surface.secondary,
                    },
                  ]}
                >
                  {data.columns.map((c) => (
                    <View
                      key={c.key}
                      style={[styles.cell, { width: colWidth(c) }]}
                    >
                      <Text
                        variant="body-sm"
                        tone="secondary"
                        numberOfLines={1}
                      >
                        {fmt(row[c.key], c)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          {data.rows.length > 200 && (
            <View style={{ padding: 12 }}>
              <Text variant="caption" tone="tertiary">
                Showing first 200 of {data.rows.length} rows — export for the
                full report.
              </Text>
            </View>
          )}
        </Card>
      )}
    </Screen>
  );
}

function colWidth(c: ReportColumn) {
  if (c.type === "money") return 130;
  if (c.type === "number") return 90;
  if (c.type === "date") return 110;
  return 170;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: palette.border.subtle,
  },
  headerRow: {
    backgroundColor: palette.teal[600],
    borderBottomColor: palette.teal[600],
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: "center",
  },
});
