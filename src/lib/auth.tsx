import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const STORAGE_KEY = "spendin_cid";

function generateCid(): string {
  return crypto.randomUUID();
}

function getStoredCid(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function setStoredCid(cid: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, cid);
}

interface AuthContextType {
  cid: string | null;
  userId: Id<"users"> | null;
  isLoading: boolean;
  syncCode: string | null;
  generateSyncCode: () => Promise<string | null>;
  syncWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cid, setCid] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { mutateAsync: getOrCreateUser } = useConvexMutation(api.users.getOrCreate);
  const { mutateAsync: generateSyncCodeMutation } = useConvexMutation(api.users.generateSyncCode);
  const { mutateAsync: syncWithCodeMutation } = useConvexMutation(api.users.syncWithCode);

  const { data: user } = useQuery({
    ...convexQuery(api.users.getByCid, cid ? { cid } : "skip"),
    enabled: !!cid,
  });

  useEffect(() => {
    let storedCid = getStoredCid();
    if (!storedCid) {
      storedCid = generateCid();
      setStoredCid(storedCid);
    }
    setCid(storedCid);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (cid && isInitialized) {
      getOrCreateUser({ cid });
    }
  }, [cid, isInitialized, getOrCreateUser]);

  const generateSyncCode = async () => {
    if (!user?._id) return null;
    const code = await generateSyncCodeMutation({ userId: user._id });
    return code;
  };

  const syncWithCode = async (code: string) => {
    if (!cid) return { success: false, error: "Not initialized" };
    const result = await syncWithCodeMutation({ syncCode: code, newCid: cid });
    if (result.success && result.cid) {
      setStoredCid(result.cid);
      setCid(result.cid);
    }
    return result;
  };

  const isLoading = !isInitialized || (cid !== null && user === undefined);

  return (
    <AuthContext.Provider
      value={{
        cid,
        userId: user?._id ?? null,
        isLoading,
        syncCode: user?.syncCode ?? null,
        generateSyncCode,
        syncWithCode,
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
