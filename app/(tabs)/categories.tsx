import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "../../src/contexts/AuthContext";
import { useNetworkAwareLoad } from "../../src/hooks/useNetworkAwareLoad";
import { categoryService } from "../../src/services/categoryService";
import { getErrorMessage } from "../../src/services/api";
import {
  Button,
  EmptyState,
  ErrorBanner,
  Screen,
  TextField,
  confirmDelete,
  styles,
} from "../../src/components/ui";
export default function Categories() {
  const { user } = useAuth();
  const state = useNetworkAwareLoad(
    user?.id,
    "categories",
    categoryService.list,
  );
  const [name, setName] = useState(""),
    [editing, setEditing] = useState<number | null>(null),
    [editName, setEditName] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { load: loadState } = state;
  useFocusEffect(
    useCallback(() => {
      void loadState();
    }, [loadState]),
  );
  const mutate = async (action: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      setName("");
      setEditing(null);
      Toast.show({ type: "success", text1: "Operação concluída." });
      await loadState();
    } catch (e) {
      Toast.show({ type: "error", text1: getErrorMessage(e) });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen
      keyboard
      refreshing={state.loading}
      onRefresh={() => {
        void loadState();
      }}
    >
      <Text style={styles.title}>Categorias</Text>
      <Text style={styles.muted}>Organize seu jardim do seu jeito.</Text>
      <ErrorBanner message={state.error} />
      <TextField
        label="Nome da nova categoria"
        maxLength={100}
        value={name}
        onChangeText={setName}
      />
      <Button
        title="Adicionar categoria"
        busy={busy}
        disabled={!name.trim() || state.offline}
        onPress={() => {
          void mutate(() => categoryService.create(name.trim()));
        }}
      />
      {!state.loading && !state.data?.length && (
        <EmptyState message="Nenhuma categoria. Crie a primeira acima." />
      )}
      {state.data?.map((c) => (
        <View key={c.id} style={styles.card}>
          {editing === c.id ? (
            <>
              <TextField
                label="Editar nome"
                maxLength={100}
                value={editName}
                onChangeText={setEditName}
              />
              <Button
                title="Salvar nome"
                busy={busy}
                disabled={!editName.trim() || state.offline}
                onPress={() => {
                  void mutate(() =>
                    categoryService.update(c.id, editName.trim()),
                  );
                }}
              />
              <Button
                title="Cancelar edição"
                secondary
                onPress={() => setEditing(null)}
              />
            </>
          ) : (
            <>
              <Text style={styles.heading}>{c.name}</Text>
              <Text style={styles.muted}>{c.plantCount} planta(s)</Text>
              <Button
                title="Editar"
                secondary
                disabled={busy || state.offline}
                onPress={() => {
                  setEditing(c.id);
                  setEditName(c.name);
                }}
              />
              {c.plantCount > 0 ? (
                <View style={{ opacity: 0.5 }}>
                  <Button
                    title="Excluir indisponível: categoria com plantas"
                    secondary
                    onPress={() =>
                      Toast.show({
                        type: "info",
                        text1:
                          "Esta categoria possui plantas e não pode ser excluída.",
                      })
                    }
                  />
                </View>
              ) : (
                <Button
                  title="Excluir categoria"
                  danger
                  disabled={busy || state.offline}
                  onPress={() =>
                    confirmDelete(c.name, () => {
                      void mutate(() => categoryService.remove(c.id));
                    })
                  }
                />
              )}
            </>
          )}
        </View>
      ))}
    </Screen>
  );
}
