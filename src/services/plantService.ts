import { api } from "./api";
import { Plant, PlantRequest, Dashboard } from "../types";
export const plantService = {
  list: async (params?: { name?: string; categoryId?: number }) =>
    (await api.get<Plant[]>("/plants", { params })).data,
  get: async (id: number) => (await api.get<Plant>(`/plants/${id}`)).data,
  dashboard: async () => (await api.get<Dashboard>("/plants/dashboard")).data,
  create: async (data: PlantRequest) =>
    (await api.post<Plant>("/plants", data)).data,
  update: async (id: number, data: PlantRequest) =>
    (await api.put<Plant>(`/plants/${id}`, data)).data,
  remove: async (id: number) => {
    await api.delete(`/plants/${id}`);
  },
};
