import { apiClient } from "@api/apiClient";
import { ScannedBill } from "@modules/inventory/types";

export interface ScanFile {
  uri: string;
  name: string;
  mimeType: string;
}

export const ocrApi = {
  /**
   * Uploads a bill photo/PDF and returns a confidence-scored DRAFT.
   * Nothing is saved server-side — the pharmacist confirms on Receive Stock.
   *
   * `orientationConfirmed` says a human has already turned the page the right
   * way up, so the server can skip guessing the rotation. That's worth a lot
   * more than it sounds: it drops a Gemini call AND lets the two cross-check
   * reads run at once instead of queueing (~22s -> ~7s). Only pass it when the
   * pixels really were reviewed — a false claim here buys speed with accuracy.
   */
  scanPurchaseBill: async (
    file: ScanFile,
    orientationConfirmed = false,
  ): Promise<ScannedBill> => {
    const form = new FormData();

    if (file.uri.startsWith("data:") || file.uri.startsWith("blob:")) {
      // Web: the picker hands back a blob/data URL — turn it into a real File.
      const blob = await (await fetch(file.uri)).blob();
      form.append("file", new File([blob], file.name, { type: file.mimeType }));
    } else {
      // Native: RN's FormData accepts the {uri,name,type} shape directly.
      form.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
    }

    if (orientationConfirmed) form.append("orientationConfirmed", "true");

    const res = await apiClient.post<{ success: boolean; data: ScannedBill }>(
      "/ocr/purchase-bill",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        // Two OCR passes on a big photo — well beyond the default timeout.
        timeout: 120000,
      },
    );
    return res.data.data;
  },
};
