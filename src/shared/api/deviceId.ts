/**
 * Stable per-install device identifier for the concurrent-device limit.
 * Generated once and persisted (SecureStore on native, localStorage on web) so
 * the backend can tell one physical device apart from another. Re-installing
 * the app produces a new id (counts as a new device) — that's expected.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "medstock-device-id";
let cached: string | null = null;

function genId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function read(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(KEY)
      : null;
  }
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

/** Returns the persisted device id, generating and storing one on first use. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await read().catch(() => null);
  if (!id) {
    id = genId();
    await write(id).catch(() => {});
  }
  cached = id;
  return id;
}

/** Coarse device label (platform) shown in future session lists. */
export function getDeviceName(): string {
  return Platform.OS;
}
