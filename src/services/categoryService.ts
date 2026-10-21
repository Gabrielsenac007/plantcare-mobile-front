import { api } from "./api";
import { Category } from "../types";
export const categoryService = {
  list: async () => (await api.get<Category[]>("/categories")).data,
  create: async (name: string) =>
    (await api.post<Category>("/categories", { name })).data,
  update: async (id: number, name: string) =>
    (await api.put<Category>(`/categories/${id}`, { name })).data,
  remove: async (id: number) => {
    await api.delete(`/categories/${id}`);
  },
};
