import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Switch, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { Preferences } from "../../src/types";
import {
  defaults,
  readPreferences,
  savePreferences,
} from "../../src/services/preferences";
import {
  requestNotificationPermission,
  cancelAll,
} from "../../src/services/notificationService";
import { refreshReminders } from "../../src/services/refreshService";
import { getCoordinates } from "../../src/services/locationService";
import { getErrorMessage } from "../../src/services/api";
import { Button, ErrorBanner, Screen, styles } from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
export default function Settings() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>(defaults),
    [timeOpen, setTimeOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      if (user)
        void readPreferences(user.id)
          .then(setPrefs)
          .catch((e) => setError(getErrorMessage(e)));
    }, [user]),
  );
  const update = async (next: Preferences) => {
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      if (
        next.reminders &&
        !prefs.reminders &&
        !(await requestNotificationPermission())
      )
        throw new Error(
          "Notificações negadas. Ative a permissão nas configurações do aparelho.",
        );
      if (next.weather && !prefs.weather) await getCoordinates(user.id, true);
      await savePreferences(user.id, next);
      setPrefs(next);
      if (next.reminders) await refreshReminders(user.id);
      else await cancelAll();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const time = new Date();
  time.setHours(prefs.hour, prefs.minute, 0, 0);
  return (
    <Screen>
      <Text style={styles.title}>Ajustes</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>{user?.name}</Text>
        <Text style={styles.text}>{user?.email}</Text>
      </View>
      <ErrorBanner message={error} />
      {error.includes("configurações") && (
        <Button
          title="Abrir configurações do aparelho"
          secondary
          onPress={() => {
            void Linking.openSettings().catch((e) =>
              setError(getErrorMessage(e)),
            );
          }}
        />
      )}
      <View style={styles.card}>
        <Text style={styles.heading}>Cuidados e lembretes</Text>
        <View style={styles.row}>
          <Switch
            accessibilityLabel="Lembretes de rega"
            disabled={busy}
            value={prefs.reminders}
            trackColor={{ true: colors.details, false: colors.border }}
            onValueChange={(value) => {
              void update({ ...prefs, reminders: value });
            }}
          />
          <Text style={styles.text}>Lembretes locais de rega</Text>
        </View>
        <Button
          title={`Horário: ${String(prefs.hour).padStart(2, "0")}:${String(prefs.minute).padStart(2, "0")}`}
          disabled={busy}
          secondary
          onPress={() => setTimeOpen(true)}
        />
        {timeOpen && (
          <>
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              onChange={(event, date) => {
                if (Platform.OS === "android") setTimeOpen(false);
                if (event.type !== "dismissed" && date)
                  void update({
                    ...prefs,
                    hour: date.getHours(),
                    minute: date.getMinutes(),
                  });
              }}
            />
            {Platform.OS === "ios" && (
              <Button
                title="Concluir horário"
                secondary
                onPress={() => setTimeOpen(false)}
              />
            )}
          </>
        )}
        <View style={styles.row}>
          <Switch
            accessibilityLabel="Clima por localização"
            value={prefs.weather}
            disabled={busy}
            trackColor={{ true: colors.details, false: colors.border }}
            onValueChange={(value) => {
              void update({ ...prefs, weather: value });
            }}
          />
          <Text style={styles.text}>Clima por localização</Text>
        </View>
        <Text style={styles.muted}>
          Somente localização em primeiro plano. Lembretes são locais; não
          usamos push remoto.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Sobre o projeto</Text>
        <Text style={styles.text}>
          Cuide das suas plantas sem esquecer nenhuma rega. O PlantCare cadastra
          plantas, organiza por categoria e acompanha quando cada uma precisa de
          água. Este projeto acadêmico integra uma API REST em Java com Spring
          Boot.
        </Text>
        <Text style={styles.heading}>Funcionalidades</Text>
        <Text style={styles.text}>
          Painel com totais, plantas de hoje e atrasadas; controle de rega;
          busca combinada com categoria; CRUD de plantas e categorias com
          bloqueio de exclusão quando há plantas; câmera e galeria; fotos
          persistidas; lembretes locais; clima Open-Meteo.
        </Text>
        <Text style={styles.heading}>Tecnologias</Text>
        <Text style={styles.text}>
          React Native + TypeScript estrito, Expo Go e Expo Router, Axios,
          StyleSheet e tokens, Nunito, ícones Expo, SecureStore, AsyncStorage e
          APIs Expo para arquivos, fotos, localização e notificações.
        </Text>
        <Text style={styles.heading}>Padrões e decisões</Text>
        <Text style={styles.text}>
          Telas orquestram; serviços isolam HTTP; tipos espelham DTOs; próxima
          rega e status pertencem ao backend. Componentes reutilizáveis,
          formulário único, rotas em abas e pilha. Context somente para
          autenticação e hooks para dados: o escopo dispensa Redux, Zustand e
          React Query. Busca espera 300 ms; datas usam o fuso local; erros,
          vazio e confirmação têm tratamento; listas usam cache por usuário.
          Design tokens preservam a paleta verde, com layout responsivo e
          acessibilidade.
        </Text>
        <Text style={styles.muted}>
          Fluxo: tela → serviço → Axios → API Spring Boot → MySQL. Clima:
          Open-Meteo, CC BY 4.0, uso acadêmico não comercial.
        </Text>
      </View>
      <Button
        title="Sair da conta"
        danger
        disabled={busy}
        onPress={() =>
          Alert.alert(
            "Sair",
            "Encerrar sessão e apagar cache e lembretes deste usuário?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Sair",
                onPress: () => {
                  setBusy(true);
                  void logout()
                    .catch((e) => setError(getErrorMessage(e)))
                    .finally(() => setBusy(false));
                },
              },
            ],
          )
        }
      />
    </Screen>
  );
}
