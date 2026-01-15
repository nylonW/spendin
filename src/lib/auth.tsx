import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

const STORAGE_KEY = "spendin_device_id";

function generateDeviceId(): string {
  return crypto.randomUUID();
}

function getStoredDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function setStoredDeviceId(deviceId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, deviceId);
}

export const CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  PLN: { symbol: "zł", name: "Polish Zloty" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

interface AuthContextType {
  deviceId: string | null;
  isLoading: boolean;
  syncCode: string | null;
  currency: CurrencyCode;
  currencySymbol: string;
  generateSyncCode: () => Promise<string | null>;
  syncWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrency: (currency: CurrencyCode) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const generateSyncCodeMutation = useMutation(api.users.generateSyncCode);
  const syncWithCodeMutation = useMutation(api.users.syncWithCode);
  const updateCurrencyMutation = useMutation(api.users.updateCurrency);

  const { data: user } = useQuery({
    ...convexQuery(api.users.getByDeviceId, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId && isInitialized,
  });

  useEffect(() => {
    let storedDeviceId = getStoredDeviceId();
    if (!storedDeviceId) {
      storedDeviceId = generateDeviceId();
      setStoredDeviceId(storedDeviceId);
    }
    setDeviceId(storedDeviceId);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (deviceId && isInitialized) {
      getOrCreateUser({ deviceId });
    }
  }, [deviceId, isInitialized, getOrCreateUser]);

  const generateSyncCode = async () => {
    if (!deviceId) return null;
    const code = await generateSyncCodeMutation({ deviceId });
    return code;
  };

  const syncWithCode = async (code: string) => {
    if (!deviceId) return { success: false, error: "Not initialized" };
    const result = await syncWithCodeMutation({ syncCode: code, deviceId });
    return result;
  };

  const updateCurrency = async (currency: CurrencyCode) => {
    if (!deviceId) return;
    await updateCurrencyMutation({ deviceId, currency });
  };

  const isLoading = !isInitialized || (deviceId !== null && user === undefined);
  const currency = (user?.currency as CurrencyCode) || "USD";
  const currencySymbol = CURRENCIES[currency]?.symbol || "$";

  return (
    <AuthContext.Provider
      value={{
        deviceId,
        isLoading,
        syncCode: user?.syncCode ?? null,
        currency,
        currencySymbol,
        generateSyncCode,
        syncWithCode,
        updateCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
