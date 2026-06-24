import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NewSaleScreen from "@modules/sale/screens/NewSaleScreen";
import SalesListScreen from "@modules/sale/screens/SalesListScreen";
import SaleDetailScreen from "@modules/sale/screens/SaleDetailScreen";

export type SaleStackParamList = {
  NewSale: undefined;
  SalesList: undefined;
  SaleDetail: { id: string };
};

const Stack = createNativeStackNavigator<SaleStackParamList>();

export default function SalesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewSale" component={NewSaleScreen} />
      <Stack.Screen name="SalesList" component={SalesListScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  );
}
