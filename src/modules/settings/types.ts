export interface Settings {
  id: string;
  organizationId: string;
  company: {
    legalName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    logoUrl: string;
    drugLicenseNo: string;
    gstin: string;
  };
  tax: {
    enabled: boolean;
    defaultRatePct: number;
    priceIncludesTax: boolean;
    invoicePrefix: string;
  };
  currency: string;
  expiryAlertDays: number[];
  alertChannels: { inApp: boolean; email: boolean; sms: boolean };
  units: string[];
  defaultReorderLevel: number;
  updatedAt: string;
}

export type SettingsPatch = {
  company?: Partial<Settings["company"]>;
  tax?: Partial<Settings["tax"]>;
  currency?: string;
  expiryAlertDays?: number[];
  alertChannels?: Partial<Settings["alertChannels"]>;
  units?: string[];
  defaultReorderLevel?: number;
};
