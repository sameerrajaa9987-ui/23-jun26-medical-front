import { useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Listens for a USB barcode scanner anywhere on the screen.
 *
 * A USB scanner is a keyboard: it "types" the code and usually presses Enter.
 * That means it only reaches an input that happens to have FOCUS — so if the
 * cashier clicked anything else first, a scan silently goes nowhere. That is the
 * single most common reason a scanner "doesn't work".
 *
 * So we watch the whole document instead and tell a scanner apart from a human
 * by SPEED: a scanner emits characters a few milliseconds apart, a person can't.
 * Slow typing never accumulates, so normal use of the other fields is untouched.
 *
 * Also handles scanners configured WITHOUT an Enter suffix, by flushing the
 * buffer once the burst goes quiet.
 */

/** Max gap between keystrokes still considered one scanner burst. */
const BURST_GAP_MS = 50;
/** Quiet period after which a burst is treated as finished (no Enter suffix). */
const FLUSH_MS = 120;
/** Shorter than this is almost certainly a human, not a scan. */
const MIN_CODE_LEN = 6;

export function useScanGun(
  onScan: (code: string) => void,
  options: { enabled?: boolean; ignoreSelector?: string } = {},
) {
  const { enabled = true, ignoreSelector } = options;
  // Hold the latest callback so the document listener never needs re-binding.
  const cb = useRef(onScan);
  useEffect(() => {
    cb.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    let buffer = "";
    let lastAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      const code = buffer.trim();
      buffer = "";
      if (code.length >= MIN_CODE_LEN) cb.current(code);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // The visible scan box handles its own Enter — don't process it twice.
      const target = e.target as HTMLElement | null;
      if (
        ignoreSelector &&
        target?.closest &&
        target.closest(ignoreSelector) !== null
      ) {
        return;
      }

      const now = Date.now();
      // A slow keystroke means a human started something new: drop the buffer.
      if (now - lastAt > BURST_GAP_MS) buffer = "";
      lastAt = now;

      if (timer) clearTimeout(timer);

      if (e.key === "Enter") {
        if (buffer.length >= MIN_CODE_LEN) {
          // Swallow the Enter so it can't also submit some other form.
          e.preventDefault();
          e.stopPropagation();
          flush();
        } else {
          buffer = "";
        }
        return;
      }

      // Printable characters only — modifiers/arrows aren't part of a code.
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer += e.key;
        timer = setTimeout(flush, FLUSH_MS);
      }
    };

    // Capture phase: we see the keys before any field consumes them.
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (timer) clearTimeout(timer);
    };
  }, [enabled, ignoreSelector]);
}
