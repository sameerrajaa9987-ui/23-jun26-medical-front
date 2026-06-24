export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  gstin: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerPayload {
  name: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}
