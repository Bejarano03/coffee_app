import { AuthAPI } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { JwtPayload } from "@/types/auth";
import { LogIn, LogOut } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { Button, H1, Input, Separator, Text, XStack, YStack } from "tamagui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signOut, session } = useAuth();

  const handleLogin = async () => {
    setLoading(true);

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const {
        access_token,
        email: userEmail,
        sub: userId,
        requiresPasswordReset,
      } = await AuthAPI.login(email, password);

      if (access_token) {
        const userPayload: JwtPayload = { email: userEmail, sub: userId };
        await signIn(access_token, userPayload, { requiresPasswordReset });
      } else {
        Alert.alert("Login Failed", "No access token received.");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Invalid credentials or server error.";
        Alert.alert('Login Failed', errorMessage)
    } finally {
      setLoading(false);
    }
  };

  // Function to call the signOut context method
  const handleSignOut = async () => {
    // The context handles clearing storage and redirecting to the login screen
    await signOut();
  };

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
    >
      <YStack
        width="85%"
        maxWidth={400}
        space="$4"
        paddings="$6"
        borderRadius="$8"
        backgroundColor="$backgroundStrong"
        shadowColor="$shadowColor"
        shadowRadius={10}
      >
        <Text fontSize="$8" fontWeight="800" textAlign="center" color="$color">
          Coffee App
        </Text>
        <Text fontSize="$6" fontWeight="700" textAlign="center" color="$color">
          Welcome back
        </Text>
        <Text textAlign="center" color="$colorAcyclic">
          Sign in to keep your Coffee App orders flowing.
        </Text>

        <Separator />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          size="$4"
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          size="$4"
        />

        <Button
          variant="outlined"
          size="$2"
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          Forgot password?
        </Button>

        <Button
          theme="active"
          iconAfter={LogIn}
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
          size="$5"
          marginTop="$2"
        >
          {loading ? "Logging In..." : "Log In"}
        </Button>

        <XStack justifyContent="center" marginTop="$4" space="$2">
          <Text color="$colorAcyclic">Don't have an account?</Text>
          <Button
            variant="outlined"
            size="$2"
            onPress={() => router.push("/signup")}
          >
            Sign up
          </Button>
        </XStack>

        {/* TEMPORARY: Sign Out Button for Testing */}
        {session && (
          <Button
            theme="red"
            iconAfter={LogOut}
            onPress={handleSignOut}
            size="$3"
            marginTop="$4"
          >
            Force Sign Out (Testing)
          </Button>
        )}
      </YStack>
    </YStack>
  );
}
