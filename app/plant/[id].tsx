import { useCallback, useRef, useState } from "react";
import { Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetworkAwareLoad } from "../../src/hooks/useNetworkAwareLoad";
import { plantService } from "../../src/services/plantService";
import {
  deleteLocalPhoto,
  pendingPhoto,
  uploadPhoto,
} from "../../src/services/photoService";
import { refreshReminders } from "../../src/services/refreshService";
import { getErrorMessage } from "../../src/services/api";
import { LocalPhoto } from "../../src/types";
import { todayISO, formatShort } from "../../src/utils/date";
import { toRequest } from "../../src/utils/plant";
import { PlantImage, StatusBadge } from "../../src/components/PlantCard";
import {
  Button,
  ErrorBanner,
  Screen,
  confirmDelete,
  styles,
} from "../../src/components/ui";
export default function Detail() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = Number(raw);
  const { user } = useAuth();
  const fetcher = useCallback(() => plantService.get(id), [id]);
  const state = useNetworkAwareLoad(user?.id, `plant:${id}`, fetcher);
  const [photo, setPhoto] = useState<LocalPhoto | null>(null),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { load: loadState } = state;
  useFocusEffect(
    useCallback(() => {
      void loadState();
      if (user)
        void pendingPhoto(user.id, id)
          .then(setPhoto)
          .catch((error) =>
            Toast.show({ type: "error", text1: getErrorMessage(error) }),
          );
    }, [loadState, user, id]),
  );
  const act = async (action: () => Promise<unknown>, remove = false) => {
    if (lock.current || !user) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      if (remove) {
        await deleteLocalPhoto(user.id, id);
        router.replace("/(tabs)/plants");
      } else await loadState();
      Toast.show({ type: "success", text1: "Pronto!" });
      await refreshReminders(user.id);
    } catch (error) {
      Toast.show({ type: "error", text1: getErrorMessage(error) });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const p = state.data;
  return (
    <Screen>
      <ErrorBanner message={state.error} />
      {!p ? (
        <Button
          title="Carregar planta"
          busy={state.loading}
          onPress={() => {
            void loadState();
          }}
        />
      ) : (
        <>
          <PlantImage uri={photo?.uri ?? p.imageUrl} large />
          <Text style={styles.title}>{p.name}</Text>
          <Text style={styles.muted}>
            {p.species || "Espécie não informada"}
          </Text>
          <StatusBadge status={p.wateringStatus} />
          {[
            ["Categoria", p.categoryName],
            ["Local", p.location],
            ["Iluminação", p.sunlight],
            ["Ambiente", p.outdoor ? "Área externa" : "Área interna"],
            ["Rega", `A cada ${p.wateringFrequency} dia(s)`],
            ["Última rega", formatShort(p.lastWatering)],
            ["Próxima rega", formatShort(p.nextWatering)],
            ["Observações", p.notes],
          ].map(([label, value]) => (
            <Text key={label} style={styles.text}>
              {label}: {value || "Não informado"}
            </Text>
          ))}
          {photo && (
            <>
              <ErrorBanner message="Planta salva; a foto ainda não foi enviada. Tente novamente." />
              <Button
                title="Tentar enviar foto novamente"
                busy={busy}
                disabled={state.offline}
                onPress={() => {
                  void act(async () => {
                    await uploadPhoto(user!.id, id, photo);
                    setPhoto(null);
                  });
                }}
              />
            </>
          )}
          <Button
            title="Reguei"
            busy={busy}
            disabled={state.offline}
            onPress={() => {
              void act(() =>
                plantService.update(id, {
                  ...toRequest(p),
                  lastWatering: todayISO(),
                }),
              );
            }}
          />
          <Button
            title="Editar planta"
            secondary
            disabled={busy || state.offline}
            onPress={() =>
              router.push({ pathname: "/plant/form", params: { id } })
            }
          />
          <Button
            title="Excluir planta"
            danger
            disabled={busy || state.offline}
            onPress={() =>
              confirmDelete(p.name, () => {
                void act(() => plantService.remove(id), true);
              })
            }
          />
        </>
      )}
    </Screen>
  );
}
