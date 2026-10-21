import Toast from "react-native-toast-message";
import { refreshReminders } from "../../src/services/refreshService";
import { getErrorMessage } from "../../src/services/api";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useResponsiveColumns } from "../../src/hooks/useResponsiveColumns";
import { useNetworkAwareLoad } from "../../src/hooks/useNetworkAwareLoad";
import { plantService } from "../../src/services/plantService";
import { categoryService } from "../../src/services/categoryService";
import { PlantCard } from "../../src/components/PlantCard";
import {
  EmptyState,
  ErrorBanner,
  TextField,
  styles,
} from "../../src/components/ui";
import { colors } from "../../src/theme/colors";
export default function Plants() {
  const { user } = useAuth();
  const [search, setSearch] = useState(""),
    [categoryId, setCategoryId] = useState<number | undefined>();
  const name = useDebounce(search.trim());
  const columns = useResponsiveColumns();
  const fetcher = useCallback(
    () => plantService.list({ name: name || undefined, categoryId }),
    [name, categoryId],
  );
  const state = useNetworkAwareLoad(
    user?.id,
    `plants:${name}:${categoryId ?? ""}`,
    fetcher,
  );
  const categories = useNetworkAwareLoad(
    user?.id,
    "categories",
    categoryService.list,
  );
  const { load: loadState } = state;
  const { load: loadCategories } = categories;
  useFocusEffect(
    useCallback(() => {
      void loadState();
      void loadCategories();
      if (user)
        void refreshReminders(user.id).catch((error) =>
          Toast.show({
            type: "error",
            text1: "Lembretes não atualizados",
            text2: getErrorMessage(error),
          }),
        );
    }, [loadState, loadCategories, user]),
  );
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, { flex: 1, paddingBottom: 0 }]}>
        <Text style={styles.title}>Minhas plantas</Text>
        <TextField
          label="Buscar por nome"
          value={search}
          onChangeText={setSearch}
          placeholder="Qual planta você procura?"
        />
        <View style={styles.row}>
          {[{ id: undefined, name: "Todas" }, ...(categories.data ?? [])].map(
            (c) => (
              <Pressable
                key={c.id ?? "all"}
                accessibilityRole="button"
                accessibilityState={{ selected: c.id === categoryId }}
                onPress={() => setCategoryId(c.id)}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor:
                    c.id === categoryId ? colors.secondary : colors.background,
                }}
              >
                <Text style={styles.label}>{c.name}</Text>
              </Pressable>
            ),
          )}
        </View>
        <ErrorBanner message={state.error || categories.error} />
        <FlatList
          key={columns}
          numColumns={columns}
          data={state.data ?? []}
          keyExtractor={(p) => String(p.id)}
          refreshing={state.loading}
          onRefresh={() => {
            void loadState();
          }}
          contentContainerStyle={{ gap: 12, paddingBottom: 96 }}
          columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              onPress={() =>
                router.push({
                  pathname: "/plant/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              message={
                state.loading
                  ? "Carregando plantas..."
                  : "Nenhuma planta encontrada. Cadastre sua primeira planta."
              }
            />
          }
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova planta"
          onPress={() => router.push("/plant/form")}
          style={({ pressed }) => ({
            position: "absolute",
            right: 20,
            bottom: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text style={[styles.title, { color: colors.white }]}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
