import { useEffect } from "react";
import { Platform } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@navigation/RootNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

const linking = {
  prefixes: [],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: "login",
          Signup: "signup",
          ForgotPassword: "forgot-password",
          ResetPassword: "reset-password",
        },
      },
      App: {
        screens: {
          Dashboard: "dashboard",
          Team: "team",
          Settings: "settings",
          Profile: "profile",
        },
      },
    },
  },
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "MedStock — Inventory & Sales";
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <NavigationContainer linking={linking as never}>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
