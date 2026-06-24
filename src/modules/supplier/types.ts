export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  gstin: string;
  isActive: boolean;
  createdAt: string;
  purchases?: { count: number; value: number; units: number };
}

export interface SupplierPayload {
  name: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export interface SupplierPurchase {
  id: string;
  receiptNo: string;
  referenceNo: string;
  receivedAt: string;
  totalQuantity: number;
  totalValue: number;
  lineCount: number;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}
