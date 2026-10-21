import { cache } from "./cache";
import { Preferences } from "../types";
export const defaults: Preferences = {
  reminders: false,
  hour: 8,
  minute: 0,
  weather: false,
};
export const readPreferences = async (id: number): Promise<Preferences> => ({
  ...defaults,
  ...(await cache.read<Preferences>(id, "preferences")),
});
export const savePreferences = (id: number, value: Preferences) =>
  cache.write(id, "preferences", value);
