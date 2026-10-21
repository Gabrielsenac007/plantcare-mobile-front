import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { Linking, Alert } from "react-native";
import { api } from "./api";
import { cache } from "./cache";
import { LocalPhoto, Plant } from "../types";
export async function pickPhoto(
  id: number,
  camera: boolean,
): Promise<LocalPhoto | null> {
  const permission = camera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      "Permissão necessária",
      "Permita o acesso para adicionar uma foto.",
      permission.canAskAgain
        ? [{ text: "Entendi" }]
        : [
            { text: "Cancelar" },
            {
              text: "Abrir configurações",
              onPress: () => {
                void Linking.openSettings().catch((error) =>
                  Alert.alert("Configurações", String(error)),
                );
              },
            },
          ],
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  const type = asset.mimeType ?? "image/jpeg";
  const extension =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(type))
    throw new Error(
      "Escolha uma foto JPEG, PNG ou WebP. Converta HEIC antes de enviar.",
    );
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024)
    throw new Error("A foto deve ter até 5 MB.");
  const directory = new Directory(Paths.document, "plants", String(id));
  directory.create({ intermediates: true, idempotent: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const file = new File(directory, name);
  new File(asset.uri).copy(file);
  return { uri: file.uri, name, type };
}
export async function uploadPhoto(
  userId: number,
  id: number,
  photo: LocalPhoto,
): Promise<Plant> {
  await cache.write(userId, `pendingPhoto:${id}`, photo);
  const body = new FormData();
  // React Native aceita descritor de arquivo; o tipo DOM do FormData só conhece Blob.
  body.append("file", photo as unknown as Blob);
  const plant = (
    await api.post<Plant>(`/plants/${id}/photo`, body, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    })
  ).data;
  const previous = await cache.read<LocalPhoto>(userId, `photo:${id}`);
  if (previous && previous.uri !== photo.uri) {
    const file = new File(previous.uri);
    if (file.exists) file.delete();
  }
  await cache.write(userId, `photo:${id}`, photo);
  await cache.write(userId, `pendingPhoto:${id}`, null);
  return plant;
}
export async function pendingPhoto(userId: number, id: number) {
  return cache.read<LocalPhoto>(userId, `pendingPhoto:${id}`);
}
export async function deleteLocalPhoto(userId: number, id: number) {
  for (const key of [`photo:${id}`, `pendingPhoto:${id}`]) {
    const p = await cache.read<LocalPhoto>(userId, key);
    if (p) {
      const f = new File(p.uri);
      if (f.exists) f.delete();
    }
    await cache.write(userId, key, null);
  }
}
export function clearLocalPhotos(userId: number) {
  const directory = new Directory(Paths.document, "plants", String(userId));
  if (directory.exists) directory.delete();
}
