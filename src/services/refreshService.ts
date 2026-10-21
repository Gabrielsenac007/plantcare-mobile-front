import { plantService } from "./plantService";
import { syncWateringReminders } from "./notificationService";
import { cache } from "./cache";
export async function refreshReminders(id: number) {
  const plants = await plantService.list();
  await cache.write(id, "plants", plants);
  await syncWateringReminders(id, plants);
}
