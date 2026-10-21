import type { ComponentRef } from "react";
import { useRef, useState } from "react";
import { Text, TextInput } from "react-native";
import { router } from "expo-router";
import { Logo } from "./Logo";
import { Button, ErrorBanner, Screen, TextField, styles } from "./ui";
import { authService } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
export function AuthForm({ register = false }: { register?: boolean }) {
  const { accept } = useAuth();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null),
    passwordRef = useRef<ComponentRef<typeof TextInput>>(null),
    confirmRef = useRef<ComponentRef<typeof TextInput>>(null),
    lock = useRef(false);
  const submit = async () => {
    if (lock.current) return;
    setError("");
    if (
      (register && !name.trim()) ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      password.length < 6
    ) {
      setError(
        "Informe os dados obrigatórios, um e-mail válido e senha com pelo menos 6 caracteres.",
      );
      return;
    }
    if (register && password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const session = register
        ? await authService.register(
            name.trim(),
            email.trim().toLowerCase(),
            password,
          )
        : await authService.login(email.trim().toLowerCase(), password);
      await accept(session);
      router.replace("/(tabs)");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen keyboard>
      <Logo />
      <Text style={styles.title}>
        {register ? "Crie seu jardim" : "Seu jardim, bem cuidado"}
      </Text>
      <Text style={styles.muted}>
        Organize suas plantas e acompanhe cada rega.
      </Text>
      <ErrorBanner message={error} />
      {register && (
        <TextField
          label="Nome"
          maxLength={100}
          value={name}
          onChangeText={setName}
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      )}
      <TextField
        ref={emailRef}
        label="E-mail"
        maxLength={254}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!show}
        autoComplete={register ? "new-password" : "current-password"}
        returnKeyType={register ? "next" : "done"}
        onSubmitEditing={() => {
          if (register) confirmRef.current?.focus();
          else void submit();
        }}
      />
      <Button
        title={show ? "Ocultar senha" : "Mostrar senha"}
        secondary
        onPress={() => setShow((v) => !v)}
      />
      {register && (
        <TextField
          ref={confirmRef}
          label="Confirmar senha"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry={!show}
          onSubmitEditing={() => {
            void submit();
          }}
        />
      )}
      <Button
        title={register ? "Criar conta" : "Entrar"}
        busy={busy}
        onPress={() => {
          void submit();
        }}
      />
      <Button
        title={register ? "Já tenho conta" : "Criar uma conta"}
        secondary
        onPress={() =>
          router.replace(register ? "/(auth)/login" : "/(auth)/register")
        }
      />
    </Screen>
  );
}
