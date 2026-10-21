import { create, isAxiosError } from "axios";
let token: string | null = null;
let expired: (() => Promise<void>) | null = null;
export function setSessionToken(value: string | null) {
  token = value;
}
export function onUnauthorized(callback: (() => Promise<void>) | null) {
  expired = callback;
}
export const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  if (!config.baseURL)
    throw new Error(
      "Configure EXPO_PUBLIC_API_URL no arquivo .env e reinicie o Expo.",
    );
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      token !== null &&
      error.config?.headers?.Authorization === `Bearer ${token}` &&
      !/\/auth\/(login|register)$/.test(error.config?.url ?? "")
    ) {
      await expired?.();
    }
    return Promise.reject(error);
  },
);
export function isConnectionError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}
export function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
      return "O servidor demorou a responder. Tente novamente.";
    if (!error.response)
      return "Sem conexão com o servidor. Confira a rede, o IP e o backend. Alterações exigem conexão.";
    return (
      error.response.data?.message ?? "Não foi possível concluir a operação."
    );
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}
