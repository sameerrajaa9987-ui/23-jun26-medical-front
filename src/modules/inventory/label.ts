import bwipjs from "bwip-js";
import { printHtml } from "@shared/print";

/**
 * Shelf-label printing.
 *
 * A pharmacy prints its own label at receive time and sticks it on the medicine,
 * because Indian strips carry no reliable scannable code of their own. The label
 * holds the shop name, product, batch, expiry and MRP, plus the SAME opaque
 * label code as both a Code128 barcode (for the cheap ₹1200 scanner every shop
 * owns) and a QR (for 2D scanners and phone cameras). Either scan resolves the
 * exact lot at the till — see `resolveScan` on the backend.
 */

export interface LabelSpec {
  labelCode: string;
  productName: string;
  batchNumber: string;
  /** ISO date or YYYY-MM-DD; shown as MM/YY, the Indian convention. */
  expiry: string | null;
  mrp: number;
  /** How many identical stickers to print — usually one per received unit. */
  copies?: number;
}

// A 38mm x 25mm sticker — one of the most common Indian pharmacy label sizes.
// Change these two if the shop's roll differs; the rest of the layout follows.
const LABEL_W_MM = 38;
const LABEL_H_MM = 25;
// Hard cap so a fat-fingered quantity can't spool a thousand labels.
const MAX_LABELS = 300;

const esc = (s: string) =>
  String(s ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!,
  );

const money = (n: number) =>
  `₹${(Math.round(Number(n) * 100) / 100).toLocaleString("en-IN")}`;

/** ISO / YYYY-MM-DD -> "MM/YY". Blank stays blank. */
function expMonthYear(expiry: string | null): string {
  if (!expiry) return "";
  const [y, m] = String(expiry).slice(0, 10).split("-");
  if (!y || !m) return "";
  return `${m}/${y.slice(2)}`;
}

/** Both symbologies of one code, as inline-able SVG strings. */
async function codeSvgs(
  code: string,
): Promise<{ barcode: string; qr: string }> {
  const [barcode, qr] = await Promise.all([
    bwipjs.toSVG({
      bcid: "code128",
      text: code,
      height: 7,
      includetext: false,
      paddingwidth: 0,
      paddingheight: 0,
    }),
    bwipjs.toSVG({ bcid: "qrcode", text: code, scale: 2 }),
  ]);
  return { barcode, qr };
}

function labelHtml(
  spec: LabelSpec,
  shopName: string,
  svgs: { barcode: string; qr: string },
): string {
  const exp = expMonthYear(spec.expiry);
  return `
    <div class="label">
      <div class="shop">${esc(shopName)}</div>
      <div class="mid">
        <div class="qr">${svgs.qr}</div>
        <div class="info">
          <div class="name">${esc(spec.productName)}</div>
          <!-- "BATCH", not "B:" — a "B:" prefix reads like the B00000000 scan
               code under the barcode, and people typed the wrong one. -->
          <div class="be">${spec.batchNumber ? `BATCH ${esc(spec.batchNumber)}` : ""}${
            exp ? `<span class="exp">EXP ${exp}</span>` : ""
          }</div>
          <div class="mrp">MRP ${money(spec.mrp)}</div>
        </div>
      </div>
      <div class="barcode">${svgs.barcode}</div>
      <div class="code">${esc(spec.labelCode)}</div>
    </div>`;
}

/**
 * Full print document: every label repeated `copies` times, flowed as a grid so
 * it prints on an A4/PDF fallback as well as a dedicated label roll. Async
 * because the barcodes are generated per distinct code.
 */
export async function buildLabelSheetHtml(
  specs: LabelSpec[],
  shopName: string,
): Promise<string> {
  // One barcode render per DISTINCT code, then repeated — a 100-unit lot
  // shouldn't pay for 100 identical renders.
  const svgByCode = new Map<string, { barcode: string; qr: string }>();
  for (const s of specs) {
    if (!svgByCode.has(s.labelCode)) {
      svgByCode.set(s.labelCode, await codeSvgs(s.labelCode));
    }
  }

  let count = 0;
  const cells: string[] = [];
  for (const s of specs) {
    const copies = Math.max(1, Math.floor(s.copies || 1));
    for (let i = 0; i < copies && count < MAX_LABELS; i++, count++) {
      cells.push(labelHtml(s, shopName, svgByCode.get(s.labelCode)!));
    }
  }

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    @page { size: ${LABEL_W_MM}mm ${LABEL_H_MM}mm; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; }
    .sheet { display: flex; flex-wrap: wrap; }
    .label {
      width: ${LABEL_W_MM}mm; height: ${LABEL_H_MM}mm;
      padding: 1mm 1.5mm; overflow: hidden;
      display: flex; flex-direction: column; page-break-inside: avoid;
    }
    .shop { font-size: 7pt; font-weight: 700; letter-spacing: .2px; text-align: center;
            border-bottom: .3mm solid #000; padding-bottom: .3mm; line-height: 1; }
    .mid { display: flex; gap: 1.2mm; flex: 1; align-items: center; padding: .6mm 0; min-height: 0; }
    .qr svg { width: 9mm; height: 9mm; display: block; }
    .info { flex: 1; min-width: 0; }
    .name { font-size: 6.5pt; font-weight: 700; line-height: 1.05;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .be { font-size: 5.5pt; margin-top: .3mm; white-space: nowrap; overflow: hidden; }
    .be .exp { margin-left: 1.5mm; }
    .mrp { font-size: 8pt; font-weight: 700; margin-top: .3mm; }
    .barcode svg { width: 100%; height: 5mm; display: block; }
    .code { font-size: 5pt; text-align: center; letter-spacing: 1px; line-height: 1; }
  </style></head>
  <body><div class="sheet">${cells.join("")}</div></body></html>`;
}

/** Renders and hands the label sheet to the OS print dialog / label printer. */
export async function printLabels(
  specs: LabelSpec[],
  shopName: string,
): Promise<void> {
  const html = await buildLabelSheetHtml(specs, shopName);
  await printHtml(html);
}
