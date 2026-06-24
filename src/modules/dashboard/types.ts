export interface DashboardSummary {
  team: { total: number; active: number };
  products: { total: number };
  inventory: { lowStock: number; stockValue: number };
  expiry: { expiringSoon: number; expired: number };
  sales: { todayCount: number; todayAmount: number };
  stockInward: { todayCount: number };
}
