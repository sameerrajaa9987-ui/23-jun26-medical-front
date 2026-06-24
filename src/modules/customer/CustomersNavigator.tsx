import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomersScreen from "@modules/customer/screens/CustomersScreen";
import CustomerFormScreen from "@modules/customer/screens/CustomerFormScreen";
import CustomerDetailScreen from "@modules/customer/screens/CustomerDetailScreen";

export type CustomerStackParamList = {
  CustomersList: undefined;
  CustomerForm: { id?: string } | undefined;
  CustomerDetail: { id: string };
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomersNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    </Stack.Navigator>
  );
}
