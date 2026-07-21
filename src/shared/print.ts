import * as Print from "expo-print";
import { Platform } from "react-native";

/**
 * Print an HTML document, cross-platform.
 *
 * On native, expo-print handles a full HTML string well. On WEB it does not:
 * `Print.printAsync({ html })` ends up printing the host page (the whole app)
 * rather than the HTML you hand it. So on web we render the HTML into an
 * isolated, off-screen iframe and print THAT — only the intended document
 * reaches the printer.
 */
export async function printHtml(html: string): Promise<void> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    printHtmlWeb(html);
    return;
  }
  await Print.printAsync({ html });
}

function printHtmlWeb(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };
  // Printing the iframe's own document blocks until the dialog closes on real
  // browsers, so afterprint is the prompt, correct moment to tidy up.
  win.onafterprint = cleanup;

  // Inline SVG lays out synchronously, but give the render a beat before we
  // freeze the page for printing. The timeout is the safety net for browsers
  // (and headless) that never fire afterprint.
  window.setTimeout(() => {
    win.focus();
    win.print();
    window.setTimeout(cleanup, 3000);
  }, 200);
}
