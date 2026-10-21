import axios from "axios";
import { cache } from "./cache";
import { Coordinates, Weather } from "../types";
const configured = Number(process.env.EXPO_PUBLIC_RAIN_THRESHOLD ?? 60);
export const RAIN_THRESHOLD = Number.isFinite(configured) ? configured : 60;
interface Forecast {
  current: { temperature_2m: number; weather_code: number };
  daily: { precipitation_probability_max: (number | null)[] };
}
export async function getWeather(
  id: number,
  point: Coordinates,
): Promise<Weather | null> {
  const stored = await cache.read<Weather>(id, "weather");
  if (stored && Date.now() - stored.fetchedAt < 30 * 60 * 1000) return stored;
  try {
    const { data } = await axios.get<Forecast>(
      "https://api.open-meteo.com/v1/forecast",
      {
        params: {
          ...point,
          current: "temperature_2m,weather_code",
          daily: "precipitation_probability_max",
          timezone: "auto",
          forecast_days: 1,
        },
        timeout: 10000,
      },
    );
    const value = {
      temperature: data.current.temperature_2m,
      code: data.current.weather_code,
      rain: data.daily.precipitation_probability_max[0] ?? 0,
      fetchedAt: Date.now(),
    };
    await cache.write(id, "weather", value);
    return value;
  } catch {
    return null;
  }
}
export function weatherDescription(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code <= 3) return "Parcialmente nublado";
  if (code <= 48) return "Nevoeiro";
  if (code <= 57) return "Garoa";
  if (code <= 67) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas de chuva";
  if (code <= 86) return "Pancadas de neve";
  return "Trovoadas";
}
