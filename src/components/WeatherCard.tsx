import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Linking, Text, View } from "react-native";
import { Weather } from "../types";
import { getCoordinates } from "../services/locationService";
import {
  getWeather,
  RAIN_THRESHOLD,
  weatherDescription,
} from "../services/weatherService";
import { readPreferences, savePreferences } from "../services/preferences";
import { getErrorMessage } from "../services/api";
import { Button, styles } from "./ui";
export function WeatherCard({
  userId,
  onRain,
}: {
  userId: number;
  onRain: (rain: boolean) => void;
}) {
  const [weather, setWeather] = useState<Weather | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [enabled, setEnabled] = useState(false);
  const load = useCallback(
    async (request = false) => {
      setBusy(true);
      setMessage("");
      try {
        let prefs = await readPreferences(userId);
        setEnabled(prefs.weather);
        if (request) {
          await getCoordinates(userId, true);
          prefs = { ...prefs, weather: true };
          await savePreferences(userId, prefs);
          setEnabled(true);
        }
        if (!prefs.weather) {
          setWeather(null);
          onRain(false);
          return;
        }
        const point = await getCoordinates(userId);
        const next = await getWeather(userId, point);
        setWeather(next);
        onRain(!!next && next.rain >= RAIN_THRESHOLD);
        if (!next) setMessage("Clima indisponível no momento.");
      } catch (error) {
        setWeather(null);
        onRain(false);
        setMessage(getErrorMessage(error));
      } finally {
        setBusy(false);
      }
    },
    [userId, onRain],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Clima no seu jardim</Text>
      {weather ? (
        <>
          <Text style={styles.title}>{Math.round(weather.temperature)} °C</Text>
          <Text style={styles.text}>
            {weatherDescription(weather.code)} · {weather.rain}% de chance de
            chuva
          </Text>
          {weather.rain >= RAIN_THRESHOLD && (
            <Text style={styles.label}>
              Previsão de chuva hoje: plantas de área externa podem pular a rega
            </Text>
          )}
          <Text style={styles.muted}>Dados: Open-Meteo · CC BY 4.0</Text>
        </>
      ) : (
        <Text style={styles.muted}>
          {message ||
            (enabled
              ? "Consultando o clima..."
              : "Ative o clima por localização. Sua posição é usada somente para a previsão.")}
        </Text>
      )}
      {!weather && (
        <Button
          title={enabled ? "Tentar novamente" : "Ativar localização e clima"}
          busy={busy}
          secondary
          onPress={() => {
            void load(true);
          }}
        />
      )}
      {message.includes("configurações") && (
        <Button
          title="Abrir configurações"
          secondary
          onPress={() => {
            void Linking.openSettings().catch((error) =>
              setMessage(String(error)),
            );
          }}
        />
      )}
    </View>
  );
}
