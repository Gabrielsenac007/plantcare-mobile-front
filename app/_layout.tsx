import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import * as Notifications from "../src/services/localNotifications";
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { Button, ErrorBanner, Loading, Screen } from "../src/components/ui";
import { colors } from "../src/theme/colors";
function Navigator() {
  const { user, loading, startupError, retry, logout } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    if (loading || startupError) return;
    const auth = segments[0] === "(auth)";
    if (!user && !auth) router.replace("/(auth)/login");
    else if (user && auth) router.replace("/(tabs)");
  }, [user, loading, startupError, segments]);
  useEffect(() => {
    if (!user) return;
    const open = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.content.data?.plantId;
      if (typeof id === "number" && Number.isInteger(id) && id > 0) {
        router.push({ pathname: "/plant/[id]", params: { id } });
      }
    };
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      void Notifications.clearLastNotificationResponseAsync().catch((error) =>
        Toast.show({ type: "error", text1: String(error) }),
      );
    }
    return () => sub.remove();
  }, [user]);
  if (loading) return <Loading />;
  if (startupError && !user)
    return (
      <Screen>
        <ErrorBanner message={startupError} />
        <Button title="Validar sessão novamente" onPress={retry} />
        <Button
          title="Ir para login"
          secondary
          onPress={() => {
            void logout()
              .then(retry)
              .catch((error) =>
                Toast.show({ type: "error", text1: String(error) }),
              );
          }}
        />
      </Screen>
    );
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.title,
        headerStyle: { backgroundColor: colors.white },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="plant/[id]" options={{ title: "Sua planta" }} />
        <Stack.Screen
          name="plant/form"
          options={{ title: "Cuidar da planta", presentation: "modal" }}
        />
      </Stack.Protected>
    </Stack>
  );
}
export default function Root() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  if (!loaded && !error) return <Loading />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <Navigator />
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
