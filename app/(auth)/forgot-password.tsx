import { AuthAPI } from '@/api/client';
import { ArrowLeft, Mail } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, H2, Input, Paragraph, Separator, YStack } from 'tamagui';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Please enter the email used on your account.');
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.requestPasswordReset(email.trim());
      Alert.alert(
        'Temporary password sent',
        'If an account exists for that email you will receive a temporary password shortly.',
      );
      router.back();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Could not start password reset. Please try again later.';
      Alert.alert('Request failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} justifyContent="center" padding="$6" gap="$4">
      <H2 textAlign="center">Reset your password</H2>
      <Paragraph textAlign="center">
        Enter the email tied to your Coffee Club account. We will send a temporary password that grants one-time
        access to change your password.
      </Paragraph>
      <Separator />
      <Input
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Button theme="active" iconAfter={Mail} onPress={handleRequest} disabled={loading} loading={loading}>
        Send temporary password
      </Button>
      <Button variant="outlined" icon={ArrowLeft} onPress={() => router.back()}>
        Back to login
      </Button>
    </YStack>
  );
}
