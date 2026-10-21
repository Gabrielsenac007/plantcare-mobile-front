import { useCallback, useState } from "react";
import { Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "../../src/contexts/AuthContext";
import { Plant, Category, PlantRequest, LocalPhoto } from "../../src/types";
import { plantService } from "../../src/services/plantService";
import { categoryService } from "../../src/services/categoryService";
import { uploadPhoto } from "../../src/services/photoService";
import { refreshReminders } from "../../src/services/refreshService";
import { getErrorMessage } from "../../src/services/api";
import { PlantForm } from "../../src/components/PlantForm";
import { Button, ErrorBanner, Screen, styles } from "../../src/components/ui";
export default function Form() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const [initial, setInitial] = useState<Plant | null>(null),
    [categories, setCategories] = useState<Category[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setReady(false);
    setError("");
    try {
      const [cats, plant] = await Promise.all([
        categoryService.list(),
        id ? plantService.get(Number(id)) : Promise.resolve(null),
      ]);
      setCategories(cats);
      setInitial(plant);
      setReady(true);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const save = async (data: PlantRequest, photo: LocalPhoto | null) => {
    if (!user) return;
    const plant = id
      ? await plantService.update(Number(id), data)
      : await plantService.create(data);
    let photoFailed = false;
    if (photo) {
      try {
        await uploadPhoto(user.id, plant.id, photo);
      } catch (e) {
        photoFailed = true;
        Toast.show({
          type: "error",
          text1: "Planta salva. Foto pendente.",
          text2: getErrorMessage(e),
          visibilityTime: 6000,
        });
      }
    }
    try {
      await refreshReminders(user.id);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Dados salvos; lembretes não atualizados.",
        text2: getErrorMessage(e),
      });
    }
    if (!photoFailed) Toast.show({ type: "success", text1: "Planta salva!" });
    router.replace({ pathname: "/plant/[id]", params: { id: plant.id } });
  };
  return (
    <Screen keyboard>
      <Text style={styles.title}>{id ? "Editar planta" : "Nova planta"}</Text>
      <ErrorBanner message={error} />
      {ready && user ? (
        <PlantForm
          initial={initial}
          categories={categories}
          userId={user.id}
          onSubmit={save}
        />
      ) : (
        <Button
          title={error ? "Tentar novamente" : "Carregando..."}
          busy={!error}
          onPress={() => {
            void load();
          }}
        />
      )}
    </Screen>
  );
}
