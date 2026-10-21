import type { ComponentRef } from "react";
import { useRef, useState } from "react";
import { Alert, Platform, Switch, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Plant, PlantRequest, Category, LocalPhoto } from "../types";
import { Button, ErrorBanner, TextField, styles } from "./ui";
import { PlantImage } from "./PlantCard";
import { todayISO, localDate, formatShort } from "../utils/date";
import { pickPhoto } from "../services/photoService";
import { getErrorMessage } from "../services/api";
import { colors } from "../theme/colors";
interface Props {
  initial: Plant | null;
  categories: Category[];
  userId: number;
  onSubmit: (data: PlantRequest, photo: LocalPhoto | null) => Promise<void>;
}
export function PlantForm({ initial, categories, userId, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? ""),
    [species, setSpecies] = useState(initial?.species ?? ""),
    [location, setLocation] = useState(initial?.location ?? ""),
    [frequency, setFrequency] = useState(
      String(initial?.wateringFrequency ?? 7),
    ),
    [last, setLast] = useState(initial?.lastWatering ?? null),
    [sunlight, setSunlight] = useState(initial?.sunlight ?? ""),
    [notes, setNotes] = useState(initial?.notes ?? ""),
    [categoryId, setCategoryId] = useState(initial?.categoryId ?? 0),
    [outdoor, setOutdoor] = useState(initial?.outdoor ?? false),
    [photo, setPhoto] = useState<LocalPhoto | null>(null),
    [dateOpen, setDateOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [picking, setPicking] = useState(false);
  const lock = useRef(false);
  const speciesRef = useRef<ComponentRef<typeof TextInput>>(null),
    locationRef = useRef<ComponentRef<typeof TextInput>>(null),
    frequencyRef = useRef<ComponentRef<typeof TextInput>>(null),
    sunRef = useRef<ComponentRef<typeof TextInput>>(null),
    notesRef = useRef<ComponentRef<typeof TextInput>>(null);
  const choose = async (camera: boolean) => {
    setPicking(true);
    try {
      const next = await pickPhoto(userId, camera);
      if (next) setPhoto(next);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPicking(false);
    }
  };
  const submit = async () => {
    if (lock.current) return;
    const days = Number(frequency);
    if (
      !name.trim() ||
      !categoryId ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 365
    ) {
      setError("Informe nome, categoria e frequência inteira de 1 a 365 dias.");
      return;
    }
    if (last && last > todayISO()) {
      setError("A última rega não pode estar no futuro.");
      return;
    }
    setError("");
    lock.current = true;
    setBusy(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          species: species.trim() || null,
          location: location.trim() || null,
          wateringFrequency: days,
          lastWatering: last,
          sunlight: sunlight.trim() || null,
          notes: notes.trim() || null,
          imageUrl: initial?.imageUrl ?? null,
          categoryId,
          outdoor,
        },
        photo,
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (!categories.length)
    return (
      <>
        <Text style={styles.text}>
          Antes de cadastrar uma planta, crie pelo menos uma categoria.
        </Text>
        <Button
          title="Criar primeira categoria"
          onPress={() => router.replace("/(tabs)/categories")}
        />
      </>
    );
  return (
    <>
      <ErrorBanner message={error} />
      <PlantImage uri={photo?.uri ?? initial?.imageUrl ?? null} />
      <Button
        title="Adicionar ou trocar foto"
        busy={picking}
        secondary
        disabled={busy}
        onPress={() =>
          Alert.alert("Foto da planta", "Como deseja adicionar a foto?", [
            {
              text: "Câmera",
              onPress: () => {
                void choose(true);
              },
            },
            {
              text: "Galeria",
              onPress: () => {
                void choose(false);
              },
            },
            { text: "Cancelar", style: "cancel" },
          ])
        }
      />
      <TextField
        label="Nome *"
        value={name}
        onChangeText={setName}
        maxLength={100}
        returnKeyType="next"
        onSubmitEditing={() => speciesRef.current?.focus()}
      />
      <TextField
        ref={speciesRef}
        label="Espécie"
        maxLength={100}
        value={species}
        onChangeText={setSpecies}
        returnKeyType="next"
        onSubmitEditing={() => locationRef.current?.focus()}
      />
      <Text style={styles.label}>Categoria *</Text>
      <View style={styles.row}>
        {categories.map((c) => (
          <Button
            key={c.id}
            title={`${categoryId === c.id ? "✓ " : ""}${c.name}`}
            secondary={categoryId !== c.id}
            onPress={() => setCategoryId(c.id)}
          />
        ))}
      </View>
      <TextField
        ref={locationRef}
        label="Local"
        maxLength={100}
        value={location}
        onChangeText={setLocation}
        returnKeyType="next"
        onSubmitEditing={() => frequencyRef.current?.focus()}
      />
      <TextField
        ref={frequencyRef}
        label="Regar a cada (dias) *"
        value={frequency}
        onChangeText={setFrequency}
        keyboardType="number-pad"
        maxLength={3}
        returnKeyType="next"
        onSubmitEditing={() => sunRef.current?.focus()}
      />
      <Button
        title={`Última rega: ${formatShort(last)}`}
        secondary
        onPress={() => setDateOpen(true)}
      />
      {last && (
        <Button
          title="Limpar última rega"
          secondary
          onPress={() => setLast(null)}
        />
      )}
      {dateOpen && (
        <>
          <DateTimePicker
            value={last ? localDate(last) : new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(event, date) => {
              if (Platform.OS === "android") setDateOpen(false);
              if (event.type !== "dismissed" && date) setLast(todayISO(date));
            }}
          />
          {Platform.OS === "ios" && (
            <Button
              title="Concluir data"
              secondary
              onPress={() => setDateOpen(false)}
            />
          )}
        </>
      )}
      <TextField
        ref={sunRef}
        label="Iluminação"
        maxLength={50}
        value={sunlight}
        onChangeText={setSunlight}
        returnKeyType="next"
        onSubmitEditing={() => notesRef.current?.focus()}
      />
      <TextField
        ref={notesRef}
        label="Observações"
        maxLength={500}
        value={notes}
        onChangeText={setNotes}
        multiline
        style={{ minHeight: 96, textAlignVertical: "top" }}
      />
      <View style={styles.row}>
        <Switch
          accessibilityLabel="Planta de área externa"
          value={outdoor}
          onValueChange={setOutdoor}
          trackColor={{ true: colors.details, false: colors.border }}
        />
        <Text style={styles.text}>Planta de área externa</Text>
      </View>
      <Button
        title="Salvar planta"
        busy={busy}
        disabled={picking}
        onPress={() => {
          void submit();
        }}
      />
      <Button
        title="Cancelar"
        secondary
        disabled={busy}
        onPress={() => router.back()}
      />
    </>
  );
}
