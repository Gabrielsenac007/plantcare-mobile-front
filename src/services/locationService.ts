import * as Location from "expo-location";
import { cache } from "./cache";
import { Coordinates } from "../types";
export async function getCoordinates(
  id: number,
  request = false,
): Promise<Coordinates> {
  const permission = request
    ? await Location.requestForegroundPermissionsAsync()
    : await Location.getForegroundPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      permission.canAskAgain
        ? "Ative a localização para consultar o clima."
        : "Localização negada. Ative a permissão nas configurações do aparelho.",
    );
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const point = { latitude: coords.latitude, longitude: coords.longitude };
    await cache.write(id, "coordinates", point);
    return point;
  } catch (error) {
    const stored = await cache.read<Coordinates>(id, "coordinates");
    if (stored) return stored;
    throw error;
  }
}
