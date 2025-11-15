import { Stack } from "expo-router";

export default function AuthLaytout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: true,
          title: "Sign in",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: true,
          title: "Create Account",
        }}
      />
    </Stack>
  );
}
