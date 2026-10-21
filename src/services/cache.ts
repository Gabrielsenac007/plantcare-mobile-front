import AsyncStorage from "@react-native-async-storage/async-storage";
const key = (userId: number, name: string) => `plantcare:${userId}:${name}`;
export const cache = {
  read: async <T>(id: number, name: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key(id, name));
    return value ? (JSON.parse(value) as T) : null;
  },
  write: async <T>(id: number, name: string, value: T) =>
    AsyncStorage.setItem(key(id, name), JSON.stringify(value)),
  clear: async (id: number) => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
      k.startsWith(`plantcare:${id}:`),
    );
    if (keys.length) await AsyncStorage.multiRemove(keys);
  },
};
