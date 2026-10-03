import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "perry_access_token";
const SESSION_KEY = "perry_cart_session";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}

export async function getToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  await storageSet(TOKEN_KEY, token);
}

export async function getCartSessionId(): Promise<string> {
  let id = await storageGet(SESSION_KEY);
  if (!id) {
    id = uuid();
    await storageSet(SESSION_KEY, id);
  }
  return id;
}
