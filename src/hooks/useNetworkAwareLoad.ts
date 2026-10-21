import { useCallback, useEffect, useRef, useState } from "react";
import { cache } from "../services/cache";
import { getErrorMessage, isConnectionError } from "../services/api";
export function useNetworkAwareLoad<T>(
  userId: number | undefined,
  key: string,
  fetcher: () => Promise<T>,
) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [offline, setOffline] = useState(false);
  const serial = useRef(0);
  useEffect(
    () => () => {
      serial.current++;
    },
    [],
  );
  const load = useCallback(async () => {
    if (!userId) return;
    const request = ++serial.current;
    setLoading(true);
    setError("");
    try {
      const value = await fetcher();
      if (request !== serial.current) return;
      setData(value);
      setOffline(false);
      await cache.write(userId, key, value);
    } catch (e) {
      if (request !== serial.current) return;
      if (isConnectionError(e)) {
        let stored: T | null = null;
        try {
          stored = await cache.read<T>(userId, key);
        } catch (cacheError) {
          setError(getErrorMessage(cacheError));
          return;
        }
        if (request !== serial.current) return;
        if (stored !== null) {
          setData(stored);
          setOffline(true);
          setError("Sem conexão: mostrando dados salvos");
        } else {
          setData(null);
          setError(getErrorMessage(e));
        }
      } else {
        setData(null);
        setOffline(false);
        setError(getErrorMessage(e));
      }
    } finally {
      if (request === serial.current) setLoading(false);
    }
  }, [userId, key, fetcher]);
  return { data, loading, error, offline, load };
}
