import { isAxiosError } from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { AuthResponse, User } from "../types";
import { authService } from "../services/authService";
import {
  onUnauthorized,
  setSessionToken,
  getErrorMessage,
} from "../services/api";
import { cache } from "../services/cache";
import {
  cancelAll,
  setNotificationOwner,
} from "../services/notificationService";
import { clearLocalPhotos } from "../services/photoService";
import { refreshReminders } from "../services/refreshService";
const TOKEN = "plantcare.token";
interface Auth {
  user: User | null;
  loading: boolean;
  startupError: string;
  retry: () => void;
  accept: (session: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [startupError, setStartupError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const logoutTask = useRef<Promise<void> | null>(null);
  const logout = useCallback((): Promise<void> => {
    if (logoutTask.current) return logoutTask.current;
    setSessionToken(null);
    setNotificationOwner(null);
    const task = (async () => {
      const results = await Promise.allSettled([
        SecureStore.deleteItemAsync(TOKEN),
        (async () => {
          const cancellation = await Promise.allSettled([cancelAll()]);
          const value = await SecureStore.getItemAsync("plantcare.userId");
          if (value) {
            const id = Number(value);
            const cleanup = await Promise.allSettled([
              cache.clear(id),
              Promise.resolve().then(() => clearLocalPhotos(id)),
            ]);
            const failure = cleanup.find(
              (result) => result.status === "rejected",
            );
            if (failure?.status === "rejected") throw failure.reason;
          }
          await SecureStore.deleteItemAsync("plantcare.userId");
          if (cancellation[0].status === "rejected")
            throw cancellation[0].reason;
        })(),
      ]);
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
    })().finally(() => {
      setUser(null);
      logoutTask.current = null;
    });
    logoutTask.current = task;
    return task;
  }, []);
  useEffect(() => {
    onUnauthorized(logout);
    return () => onUnauthorized(null);
  }, [logout]);
  const accept = useCallback(async (session: AuthResponse) => {
    await SecureStore.setItemAsync(TOKEN, session.token);
    await SecureStore.setItemAsync("plantcare.userId", String(session.user.id));
    setSessionToken(session.token);
    setNotificationOwner(session.user.id);
    setUser(session.user);
    void refreshReminders(session.user.id).catch((error) =>
      console.warn("Lembretes:", getErrorMessage(error)),
    );
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN);
      if (token) {
        setSessionToken(token);
        const current = await authService.me();
        if (active) {
          setNotificationOwner(current.id);
          setUser(current);
          await SecureStore.setItemAsync(
            "plantcare.userId",
            String(current.id),
          );
          void refreshReminders(current.id).catch((error) =>
            console.warn("Lembretes:", getErrorMessage(error)),
          );
        }
      }
    })()
      .catch((error) => {
        if (active && !(isAxiosError(error) && error.response?.status === 401))
          setStartupError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <Context.Provider
      value={{
        user,
        loading,
        startupError,
        retry: () => {
          setLoading(true);
          setStartupError("");
          setAttempt((a) => a + 1);
        },
        accept,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider ausente");
  return value;
}
