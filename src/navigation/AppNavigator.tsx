/**
 * AppNavigator — responsive app shell.
 *
 *  - Wide screens (web / desktop ≥ wideBreakpoint): a permanent left Sidebar
 *    next to the content region.
 *  - Narrow screens (phones): content fills the screen with a top app bar; the
 *    Sidebar slides over as an overlay when the menu is tapped.
 *
 * Section routing is handled with local state; sections that need sub-screens
 * (Team → Add/Detail) host their own nested native-stack.
 */
import React, { useState, createContext, useContext } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Menu, Activity } from "lucide-react-native";
import { palette, layout, radius } from "@shared/designSystem";
import { Text, HStack } from "@shared/ui";
import { Sidebar } from "./Sidebar";
import { NAV_ITEMS } from "./navItems";

import DashboardScreen from "@modules/dashboard/screens/DashboardScreen";
import ProductsNavigator from "@modules/product/ProductsNavigator";
import WarehouseScreen from "@modules/warehouse/screens/WarehouseScreen";
import InventoryNavigator from "@modules/inventory/InventoryNavigator";
import ReceivingNavigator from "@modules/inventory/ReceivingNavigator";
import SearchScreen from "@modules/inventory/screens/SearchScreen";
import SalesNavigator from "@modules/sale/SalesNavigator";
import CustomersNavigator from "@modules/customer/CustomersNavigator";
import SuppliersNavigator from "@modules/supplier/SuppliersNavigator";
import ExpiryScreen from "@modules/expiry/screens/ExpiryScreen";
import DamagedScreen from "@modules/stockops/screens/DamagedScreen";
import TransfersScreen from "@modules/stockops/screens/TransfersScreen";
import ReportsScreen from "@modules/reports/screens/ReportsScreen";
import TeamNavigator from "@modules/team/TeamNavigator";
import AuditLogScreen from "@modules/team/screens/AuditLogScreen";
import SettingsScreen from "@modules/settings/screens/SettingsScreen";
import ProfileScreen from "@modules/profile/screens/ProfileScreen";

/** Lets any screen jump to another top-level section by name. */
export const SectionNav = createContext<(name: string) => void>(() => {});
export const useSectionNav = () => useContext(SectionNav);

const SCREENS: Record<string, React.ComponentType> = {
  Dashboard: DashboardScreen,
  Products: ProductsNavigator,
  Warehouse: WarehouseScreen,
  Inventory: InventoryNavigator,
  Receive: ReceivingNavigator,
  Sales: SalesNavigator,
  Transfers: TransfersScreen,
  Expiry: ExpiryScreen,
  Damaged: DamagedScreen,
  Customers: CustomersNavigator,
  Suppliers: SuppliersNavigator,
  Search: SearchScreen,
  Reports: ReportsScreen,
  Team: TeamNavigator,
  AuditLog: AuditLogScreen,
  Settings: SettingsScreen,
  Profile: ProfileScreen,
};

export default function AppNavigator() {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.wideBreakpoint;
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navigate = (name: string) => {
    setActive(name);
    setMenuOpen(false);
  };

  const ActiveScreen = SCREENS[active] || DashboardScreen;
  const activeLabel =
    NAV_ITEMS.find((i) => i.name === active)?.label || "MedStock";

  return (
    <SectionNav.Provider value={navigate}>
      <View style={styles.root}>
        {isWide && (
          <Sidebar
            activeRoute={active}
            onNavigate={navigate}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        )}

        <View style={{ flex: 1 }}>
          {!isWide && (
            <SafeAreaView edges={["top"]} style={styles.appBarSafe}>
              <HStack align="center" gap={12} style={styles.appBar}>
                <Pressable
                  onPress={() => setMenuOpen(true)}
                  hitSlop={8}
                  style={styles.menuBtn}
                >
                  <Menu
                    size={22}
                    color={palette.text.primary}
                    strokeWidth={2}
                  />
                </Pressable>
                <View style={styles.appBarLogo}>
                  <Activity size={16} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text variant="h4" tone="primary">
                  {activeLabel}
                </Text>
              </HStack>
            </SafeAreaView>
          )}

          <View style={{ flex: 1 }}>
            <ActiveScreen />
          </View>
        </View>

        {/* Mobile slide-over sidebar */}
        {!isWide && (
          <Modal
            visible={menuOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuOpen(false)}
          >
            <Pressable
              style={styles.backdrop}
              onPress={() => setMenuOpen(false)}
            >
              <Pressable
                style={styles.drawer}
                onPress={(e) => e.stopPropagation()}
              >
                <Sidebar activeRoute={active} onNavigate={navigate} />
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </View>
    </SectionNav.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: palette.surface.secondary,
  },
  appBarSafe: { backgroundColor: palette.surface.primary },
  appBar: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: palette.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: palette.border.default,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  appBarLogo: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: palette.teal[600],
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    flexDirection: "row",
  },
  drawer: { width: layout.sidebarWidth, height: "100%" },
});
