export interface StockSummaryItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  baseUnit: string;
  reorderLevel: number;
  sellingPrice: number;
  isActive: boolean;
  onHand: number;
  reserved: number;
  available: number;
  costValue: number;
  sellValue: number;
  batches: number;
  locations: number;
  isLow: boolean;
}

export interface StockValue {
  costValue: number;
  sellValue: number;
  totalUnits: number;
  products: number;
}

export interface BatchLocation {
  locationId: string;
  code: string;
  path: string;
  quantity: number;
}

export interface ProductBatchStock {
  batchId: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string | null;
  purchasePrice: number;
  expired: boolean;
  onHand: number;
  locations: BatchLocation[];
}

export interface ProductInventory {
  product: {
    id: string;
    name: string;
    sku: string;
    baseUnit: string;
    sellingPrice: number;
    reorderLevel: number;
    prescriptionRequired: boolean;
    scheduleDrug: string;
  };
  summary: {
    onHand: number;
    available: number;
    stockValue: number;
    batches: number;
    locations: number;
  };
  batches: ProductBatchStock[];
}

export interface ReceiptLineInput {
  productId: string;
  batchNumber: string;
  mfgDate?: string;
  expiryDate?: string;
  purchasePrice?: number;
  unit?: string;
  quantity: number;
  locationId: string;
}

export interface ReceivePayload {
  supplierId?: string | null;
  supplierName?: string;
  referenceNo?: string;
  notes?: string;
  receivedAt?: string;
  lines: ReceiptLineInput[];
}

export interface ReceiptListItem {
  id: string;
  receiptNo: string;
  supplierName: string;
  referenceNo: string;
  receivedAt: string;
  receivedByName: string;
  totalQuantity: number;
  totalValue: number;
  lineCount: number;
  createdAt: string;
}

export interface ReceiptDetail extends ReceiptListItem {
  notes: string;
  lines: {
    productId: string;
    productName: string;
    sku: string;
    batchNumber: string;
    mfgDate: string | null;
    expiryDate: string | null;
    purchasePrice: number;
    unit: string;
    quantity: number;
    baseQuantity: number;
    locationCode: string;
    lineValue: number;
  }[];
}

export interface SearchBatchResult {
  batchId: string;
  productId: string;
  productName: string;
  sku: string;
  baseUnit: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string | null;
  onHand: number;
  locations: { code: string; path: string; quantity: number }[];
}

export interface SearchResult {
  products: StockSummaryItem[];
  batches: SearchBatchResult[];
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}
