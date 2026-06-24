import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReceiveStockScreen from "@modules/inventory/screens/ReceiveStockScreen";
import ReceiptsScreen from "@modules/inventory/screens/ReceiptsScreen";
import ReceiptDetailScreen from "@modules/inventory/screens/ReceiptDetailScreen";

export type ReceivingStackParamList = {
  ReceiveStock: undefined;
  Receipts: undefined;
  ReceiptDetail: { id: string };
};

const Stack = createNativeStackNavigator<ReceivingStackParamList>();

export default function ReceivingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReceiveStock" component={ReceiveStockScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />
    </Stack.Navigator>
  );
}
