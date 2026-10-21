import * as Notifications from "./localNotifications";
import { AndroidImportance } from "./localNotifications";
import { Platform } from "react-native";
import { cache } from "./cache";
import { readPreferences } from "./preferences";
import { Plant } from "../types";
import { reminderDate } from "../utils/date";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("rega", {
      name: "Rega",
      importance: AndroidImportance.DEFAULT,
    });
  return (await Notifications.requestPermissionsAsync()).granted;
}
let generation = 0;
let owner: number | null = null;
export function setNotificationOwner(id: number | null) {
  owner = id;
  generation++;
}
let queue: Promise<void> = Promise.resolve();
export async function cancelAll(): Promise<void> {
  generation++;
  await queue;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
export function syncWateringReminders(
  id: number,
  plants: Plant[],
): Promise<void> {
  if (id !== owner) return Promise.resolve();
  const version = ++generation;
  const run = async () => {
    if (version !== generation) return;
    const pref = await readPreferences(id);
    if (version !== generation || id !== owner) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (version !== generation || id !== owner) return;
    if (
      !pref.reminders ||
      !(await Notifications.getPermissionsAsync()).granted
    ) {
      await cache.write(id, "notificationMap", {});
      return;
    }
    // Reserva margem para o limite de notificações pendentes do iOS.
    const candidates = plants
      .filter((p) => p.nextWatering)
      .map((plant) => ({
        plant,
        date: reminderDate(plant.nextWatering!, pref.hour, pref.minute),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 60);
    const map: Record<number, string> = {};
    for (const { plant, date } of candidates) {
      if (version !== generation) break;
      map[plant.id] = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hora de regar",
          body: `Hora de regar a ${plant.name}${plant.location ? ` (${plant.location})` : ""}`,
          data: { plantId: plant.id },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: "rega",
        },
      });
    }
    await cache.write(id, "notificationMap", map);
  };
  const result = queue.then(run, run);
  queue = result.catch((error) => {
    console.warn("Falha ao sincronizar lembretes:", String(error));
  });
  return result;
}
