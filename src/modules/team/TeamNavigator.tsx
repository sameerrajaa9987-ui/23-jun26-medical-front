import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeamScreen from "@modules/team/screens/TeamScreen";
import AddUserScreen from "@modules/team/screens/AddUserScreen";
import UserDetailScreen from "@modules/team/screens/UserDetailScreen";

export type TeamStackParamList = {
  TeamList: undefined;
  AddUser: undefined;
  UserDetail: { id: string };
};

const Stack = createNativeStackNavigator<TeamStackParamList>();

/** Nested stack for the Team section (list → add / detail). */
export default function TeamNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeamList" component={TeamScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
    </Stack.Navigator>
  );
}
