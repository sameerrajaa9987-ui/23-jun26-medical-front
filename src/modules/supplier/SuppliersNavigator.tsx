import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SuppliersScreen from "@modules/supplier/screens/SuppliersScreen";
import SupplierFormScreen from "@modules/supplier/screens/SupplierFormScreen";
import SupplierDetailScreen from "@modules/supplier/screens/SupplierDetailScreen";

export type SupplierStackParamList = {
  SuppliersList: undefined;
  SupplierForm: { id?: string } | undefined;
  SupplierDetail: { id: string };
};

const Stack = createNativeStackNavigator<SupplierStackParamList>();

export default function SuppliersNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuppliersList" component={SuppliersScreen} />
      <Stack.Screen name="SupplierForm" component={SupplierFormScreen} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
    </Stack.Navigator>
  );
}
