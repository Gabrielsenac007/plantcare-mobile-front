import type { ComponentRef } from "react";
import { ReactNode, forwardRef } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.title },
  heading: { fontFamily: fonts.bold, fontSize: 20, color: colors.title },
  text: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  card: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.title },
  error: { padding: 12, borderRadius: 8, backgroundColor: colors.redBg },
  errorText: { fontFamily: fonts.semibold, color: colors.red },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
});
export function Screen({
  children,
  refreshing,
  onRefresh,
  keyboard = false,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboard?: boolean;
}) {
  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: danger
            ? colors.red
            : secondary
              ? colors.secondary
              : colors.primary,
          opacity: busy || disabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? colors.title : colors.white} />
      ) : (
        <Text style={[styles.buttonText, secondary && { color: colors.title }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export const TextField = forwardRef<
  ComponentRef<typeof TextInput>,
  TextInputProps & { label: string }
>(function TextField({ label, ...props }, ref) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
});
export function ErrorBanner({ message }: { message: string }) {
  return message ? (
    <View accessibilityRole="alert" style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  ) : null;
}
export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}
export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>Carregando...</Text>
    </View>
  );
}
export function confirmDelete(name: string, action: () => void) {
  Alert.alert(
    "Confirmar exclusão",
    `Excluir "${name}"? Esta ação não pode ser desfeita.`,
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: action },
    ],
  );
}
