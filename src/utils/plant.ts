import { Plant, PlantRequest, WateringStatus } from "../types";
import { colors } from "../theme/colors";
export const statusConfig: Record<
  WateringStatus,
  { label: string; color: string; background: string }
> = {
  UPCOMING: {
    label: "Em dia",
    color: colors.title,
    background: colors.secondary,
  },
  DUE_TODAY: {
    label: "Regar hoje",
    color: colors.amber,
    background: colors.amberBg,
  },
  OVERDUE: { label: "Atrasada", color: colors.red, background: colors.redBg },
  NOT_SET: { label: "Sem data", color: colors.muted, background: colors.gray },
};
export const toRequest = (p: Plant): PlantRequest => ({
  name: p.name,
  species: p.species,
  location: p.location,
  wateringFrequency: p.wateringFrequency,
  lastWatering: p.lastWatering,
  sunlight: p.sunlight,
  notes: p.notes,
  imageUrl: p.imageUrl,
  categoryId: p.categoryId,
  outdoor: p.outdoor,
});
