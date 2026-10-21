export type WateringStatus = "UPCOMING" | "DUE_TODAY" | "OVERDUE" | "NOT_SET";
export interface User {
  id: number;
  name: string;
  email: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}
export interface Category {
  id: number;
  name: string;
  plantCount: number;
}
export interface Plant {
  id: number;
  name: string;
  species: string | null;
  location: string | null;
  wateringFrequency: number;
  lastWatering: string | null;
  nextWatering: string | null;
  wateringStatus: WateringStatus;
  sunlight: string | null;
  notes: string | null;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  outdoor: boolean;
}
export type PlantRequest = Omit<
  Plant,
  "id" | "nextWatering" | "wateringStatus" | "categoryName"
>;
export interface Dashboard {
  totalPlants: number;
  plantsToWaterToday: number;
  overduePlants: number;
  totalCategories: number;
  wateringToday: Plant[];
  overdue: Plant[];
}
export interface Preferences {
  reminders: boolean;
  hour: number;
  minute: number;
  weather: boolean;
}
export interface Coordinates {
  latitude: number;
  longitude: number;
}
export interface Weather {
  temperature: number;
  code: number;
  rain: number;
  fetchedAt: number;
}
export interface LocalPhoto {
  uri: string;
  name: string;
  type: string;
}
