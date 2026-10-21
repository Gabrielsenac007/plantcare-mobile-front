import { api } from "./api";
import { AuthResponse, User } from "../types";
export const authService = {
  login: async (email: string, password: string) =>
    (await api.post<AuthResponse>("/auth/login", { email, password })).data,
  register: async (name: string, email: string, password: string) =>
    (await api.post<AuthResponse>("/auth/register", { name, email, password }))
      .data,
  me: async () => (await api.get<User>("/auth/me")).data,
};
