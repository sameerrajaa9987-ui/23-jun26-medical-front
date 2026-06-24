import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProductsScreen from "@modules/product/screens/ProductsScreen";
import ProductFormScreen from "@modules/product/screens/ProductFormScreen";

export type ProductStackParamList = {
  ProductsList: undefined;
  ProductForm: { id?: string } | undefined;
};

const Stack = createNativeStackNavigator<ProductStackParamList>();

export default function ProductsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} />
    </Stack.Navigator>
  );
}
