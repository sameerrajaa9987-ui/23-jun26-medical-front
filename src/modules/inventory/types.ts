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

/* ---------------- Bill scan (OCR) ---------------- */

/** One extracted value plus how much we trust it. */
export interface OcrField<T = string | number | null> {
  value: T;
  /** "high" = two independent reads agreed AND the rules passed. */
  confidence: "high" | "low";
  /** The rival reading, when the two passes disagreed. */
  alternative: T | null;
  reason: string | null;
}

export interface OcrProductRef {
  id: string;
  name: string;
  sku: string;
  baseUnit: string;
  packs: { unit: string; factor: number }[];
  mrp: number;
  taxRatePct: number;
  score?: number;
}

/** How the bill's QTY unit maps onto the product's own units. */
export interface UnitResolution {
  /** false = we could not prove the unit; the pharmacist must pick it. */
  resolved: boolean;
  unit: string | null;
  factor: number | null;
  /** Why it couldn't be resolved (blocks the line). */
  reason: string | null;
  /** Advisory — resolved, but worth a second look (doesn't block). */
  note: string | null;
}

export interface ScannedLine {
  productName: string | null;
  pack: string | null;
  batchNo: string | null;
  expiry: string | null;
  expiryDate: string | null;
  quantity: number | null;
  mrp: number | null;
  rate: number | null;
  gstPct: number | null;
  /** The bill's QTY counts PACKS — this says which pack unit that is. */
  unitResolution: UnitResolution;
  /** Bill RATE is per pack; this is the per-base-unit cost (null if unresolved). */
  costPerBaseUnit: number | null;
  /** Free goods on the bill — physically arrive, so the human decides. */
  freeQty: number;
  fields: {
    batchNo: OcrField<string | null>;
    expiry: OcrField<string | null>;
    quantity: OcrField<number | null>;
    mrp: OcrField<number | null>;
    rate: OcrField<number | null>;
    gstPct: OcrField<number | null>;
    pack: OcrField<string | null>;
  };
  /** Catalogue link — null when we couldn't match confidently. */
  match: OcrProductRef | null;
  matchScore: number;
  suggestions: OcrProductRef[];
  needsReview: boolean;
  criticalIssues: string[];
  lowFields: string[];
  missing: string[];
}

export interface ScannedBill {
  supplierName: string | null;
  /** Existing supplier this bill confidently came from, if any. */
  supplierMatch: { id: string; name: string; score: number } | null;
  invoiceNo: string | null;
  invoiceDate: string | null;
  rotation: number;
  /** Set when this invoice number was already received — re-saving doubles stock. */
  duplicate: {
    receiptNo: string;
    referenceNo: string;
    receivedAt: string;
    supplierName: string;
  } | null;
  lines: ScannedLine[];
  stats: {
    total: number;
    matched: number;
    needsReview: number;
    confident: number;
    readScore: number;
  };
}
