import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Plant, WateringStatus } from "../types";
import { colors } from "../theme/colors";
import { statusConfig } from "../utils/plant";
import { formatShort } from "../utils/date";
import { styles } from "./ui";
export function PlantImage({
  uri,
  large = false,
}: {
  uri: string | null;
  large?: boolean;
}) {
  const [brokenUri, setBrokenUri] = useState<string | null>(null);
  return uri && uri !== brokenUri ? (
    <Image
      accessibilityLabel="Foto da planta"
      source={{ uri }}
      onError={() => setBrokenUri(uri)}
      style={{ width: "100%", height: large ? 260 : 150, borderRadius: 12 }}
    />
  ) : (
    <View
      style={{
        height: large ? 260 : 150,
        backgroundColor: colors.secondary,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="leaf-outline" size={64} color={colors.primary} />
    </View>
  );
}
export function StatusBadge({ status }: { status: WateringStatus }) {
  const s = statusConfig[status];
  return (
    <Text
      style={[
        styles.label,
        {
          alignSelf: "flex-start",
          color: s.color,
          backgroundColor: s.background,
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 8,
        },
      ]}
    >
      {s.label}
    </Text>
  );
}
export function PlantCard({
  plant,
  onPress,
  rain = false,
}: {
  plant: Plant;
  onPress: () => void;
  rain?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${plant.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          flex: 1,
          opacity: pressed ? 0.8 : 1,
          borderColor: rain ? colors.details : colors.border,
        },
      ]}
    >
      <PlantImage uri={plant.imageUrl} />
      <Text style={styles.heading}>{plant.name}</Text>
      <Text style={styles.muted}>
        {plant.species || plant.categoryName} ·{" "}
        {plant.location || "Local não informado"}
      </Text>
      <StatusBadge status={plant.wateringStatus} />
      <Text style={styles.text}>
        Próxima rega: {formatShort(plant.nextWatering)}
      </Text>
      {rain && (
        <Text style={styles.label}>
          ☔ Área externa · confira a chuva antes de regar
        </Text>
      )}
    </Pressable>
  );
}
