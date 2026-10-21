import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetworkAwareLoad } from "../../src/hooks/useNetworkAwareLoad";
import { plantService } from "../../src/services/plantService";
import { refreshReminders } from "../../src/services/refreshService";
import { getErrorMessage } from "../../src/services/api";
import { todayISO } from "../../src/utils/date";
import { toRequest } from "../../src/utils/plant";
import { Plant } from "../../src/types";
import { Button, ErrorBanner, Screen, styles } from "../../src/components/ui";
import { StatusBadge } from "../../src/components/PlantCard";
import { WeatherCard } from "../../src/components/WeatherCard";
export default function Home() {
  const { user } = useAuth();
  const state = useNetworkAwareLoad(
    user?.id,
    "dashboard",
    plantService.dashboard,
  );
  const [rain, setRain] = useState(false),
    [busy, setBusy] = useState<number | null>(null);
  const lock = useRef(false);
  const { load: loadState } = state;
  useFocusEffect(
    useCallback(() => {
      void loadState();
      if (user)
        void refreshReminders(user.id).catch((error) =>
          Toast.show({
            type: "error",
            text1: "Lembretes não atualizados",
            text2: getErrorMessage(error),
          }),
        );
    }, [loadState, user]),
  );
  const water = async (p: Plant) => {
    if (lock.current || !user) return;
    lock.current = true;
    setBusy(p.id);
    try {
      await plantService.update(p.id, {
        ...toRequest(p),
        lastWatering: todayISO(),
      });
      Toast.show({ type: "success", text1: `${p.name} regada!` });
      await loadState();
      await refreshReminders(user.id);
    } catch (e) {
      Toast.show({ type: "error", text1: getErrorMessage(e) });
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  const data = state.data;
  return (
    <Screen
      refreshing={state.loading}
      onRefresh={() => {
        void loadState();
      }}
    >
      <Text style={styles.muted}>PLANTCARE · SEU JARDIM</Text>
      <Text style={styles.title}>Olá, {user?.name.split(" ")[0]} 🌱</Text>
      <Text style={styles.text}>Um pouco de cuidado faz tudo florescer.</Text>
      <ErrorBanner message={state.error} />
      {!data && (
        <Button
          title={state.loading ? "Carregando..." : "Tentar novamente"}
          busy={state.loading}
          onPress={() => {
            void loadState();
          }}
        />
      )}
      {data && (
        <>
          <View style={styles.row}>
            {[
              ["Plantas", data.totalPlants],
              ["Regar hoje", data.plantsToWaterToday],
              ["Atrasadas", data.overduePlants],
              ["Categorias", data.totalCategories],
            ].map(([label, value]) => (
              <View
                key={label}
                style={[styles.card, { flexGrow: 1, minWidth: "40%" }]}
              >
                <Text style={styles.title}>{value}</Text>
                <Text style={styles.muted}>{label}</Text>
              </View>
            ))}
          </View>
          {user && <WeatherCard userId={user.id} onRain={setRain} />}
          <Button
            title="Adicionar planta"
            onPress={() => router.push("/plant/form")}
          />
          {[
            { title: "Regar hoje", plants: data.wateringToday },
            { title: "Atrasadas", plants: data.overdue },
          ].map((section) => (
            <View key={section.title} style={{ gap: 12 }}>
              <Text style={styles.heading}>{section.title}</Text>
              {section.plants.length === 0 && (
                <Text style={styles.muted}>Tudo em dia por aqui.</Text>
              )}
              {section.plants.map((p) => (
                <View key={p.id} style={styles.card}>
                  <Text
                    style={styles.heading}
                    onPress={() =>
                      router.push({
                        pathname: "/plant/[id]",
                        params: { id: p.id },
                      })
                    }
                  >
                    {p.name}
                  </Text>
                  <Text style={styles.muted}>
                    {p.location || p.categoryName}
                  </Text>
                  <StatusBadge status={p.wateringStatus} />
                  {rain && p.outdoor && section.title === "Regar hoje" && (
                    <Text style={styles.label}>
                      ☔ Área externa: confira a chuva antes de regar.
                    </Text>
                  )}
                  <Button
                    title="Reguei"
                    busy={busy === p.id}
                    disabled={state.offline || busy !== null}
                    onPress={() => {
                      void water(p);
                    }}
                  />
                  <Button
                    title="Ver detalhes"
                    secondary
                    onPress={() =>
                      router.push({
                        pathname: "/plant/[id]",
                        params: { id: p.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
