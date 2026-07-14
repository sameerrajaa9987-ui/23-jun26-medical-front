import {
  LayoutDashboard,
  Package,
  Warehouse,
  Boxes,
  PackagePlus,
  Search,
  ShoppingCart,
  Contact,
  Truck,
  AlarmClock,
  ShieldAlert,
  ArrowLeftRight,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  UserRound,
  BellRing,
  type LucideIcon,
} from "lucide-react-native";
import { PERMISSIONS } from "@shared/permissions";

export interface NavItem {
  name: string;
  label: string;
  icon: LucideIcon;
  /** Visible if the user holds this permission (admins always pass). */
  permission?: string;
  /** Visible to Admin only. */
  adminOnly?: boolean;
}

/**
 * Phase 1 navigation. Later phases append their modules (Products, Inventory,
 * Sales, …) here — each gated by its permission so the sidebar reflects exactly
 * what the signed-in user can do (SOW §4 role-based experience).
 */
export const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    name: "Products",
    label: "Products",
    icon: Package,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    name: "Warehouse",
    label: "Warehouse",
    icon: Warehouse,
    permission: PERMISSIONS.WAREHOUSE_MANAGE,
  },
  {
    name: "Inventory",
    label: "Inventory",
    icon: Boxes,
    permission: PERMISSIONS.INVENTORY_VIEW,
  },
  {
    name: "Receive",
    label: "Receive Stock",
    icon: PackagePlus,
    permission: PERMISSIONS.STOCK_INWARD_MANAGE,
  },
  {
    name: "Sales",
    label: "Sales",
    icon: ShoppingCart,
    permission: PERMISSIONS.SALES_MANAGE,
  },
  {
    name: "Transfers",
    label: "Transfers",
    icon: ArrowLeftRight,
    permission: PERMISSIONS.STOCK_TRANSFER_MANAGE,
  },
  {
    name: "Expiry",
    label: "Expiry",
    icon: AlarmClock,
    permission: PERMISSIONS.EXPIRY_MANAGE,
  },
  {
    name: "Damaged",
    label: "Damaged",
    icon: ShieldAlert,
    permission: PERMISSIONS.DAMAGED_MANAGE,
  },
  {
    name: "Customers",
    label: "Customers",
    icon: Contact,
    permission: PERMISSIONS.CUSTOMERS_MANAGE,
  },
  {
    name: "Suppliers",
    label: "Suppliers",
    icon: Truck,
    permission: PERMISSIONS.SUPPLIERS_MANAGE,
  },
  {
    name: "Search",
    label: "Search",
    icon: Search,
    permission: PERMISSIONS.PRODUCT_SEARCH,
  },
  {
    name: "Reports",
    label: "Reports",
    icon: BarChart3,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  { name: "Team", label: "Team & Access", icon: Users, adminOnly: true },
  {
    name: "AuditLog",
    label: "Audit Logs",
    icon: ScrollText,
    permission: PERMISSIONS.AUDIT_VIEW,
  },
  { name: "Settings", label: "Settings", icon: Settings, adminOnly: true },
  // Personal productivity — available to every signed-in user (no permission).
  { name: "Reminders", label: "Reminders", icon: BellRing },
  { name: "Profile", label: "Profile", icon: UserRound },
];
