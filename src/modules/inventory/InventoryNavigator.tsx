import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InventoryScreen from "@modules/inventory/screens/InventoryScreen";
import ProductInventoryScreen from "@modules/inventory/screens/ProductInventoryScreen";

export type InventoryStackParamList = {
  InventoryList: undefined;
  ProductInventory: { id: string };
};

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export default function InventoryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventoryList" component={InventoryScreen} />
      <Stack.Screen
        name="ProductInventory"
        component={ProductInventoryScreen}
      />
    </Stack.Navigator>
  );
}
