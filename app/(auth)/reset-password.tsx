import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button, H2, Input, Paragraph, Separator, YStack } from 'tamagui';
import { KeyRound, LogOut } from '@tamagui/lucide-icons';
import { router } from 'expo-router';

import { ProfileAPI } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function ResetPasswordScreen() {
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { markPasswordResetComplete, signOut, requiresPasswordReset } = useAuth();

  useEffect(() => {
    if (!requiresPasswordReset) {
      router.replace('/(tabs)');
    }
  }, [requiresPasswordReset]);

  const handleSubmit = async () => {
    if (!temporaryPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill out every field to continue.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New passwords must match.');
      return;
    }

    setLoading(true);
    try {
      await ProfileAPI.updatePassword({ currentPassword: temporaryPassword, newPassword });
      await markPasswordResetComplete();
      Alert.alert('Password updated', 'Your password has been updated successfully.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update password. Double-check the temporary password.';
      Alert.alert('Update failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} justifyContent="center" padding="$6" gap="$4">
      <H2 textAlign="center">Set a new password</H2>
      <Paragraph textAlign="center">
        Enter the temporary password from your email and choose a new password to regain full access.
      </Paragraph>
      <Separator />
      <Input
        placeholder="Temporary password"
        secureTextEntry
        value={temporaryPassword}
        onChangeText={setTemporaryPassword}
      />
      <Input
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <Input
        placeholder="Confirm new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button theme="active" iconAfter={KeyRound} onPress={handleSubmit} disabled={loading} loading={loading}>
        Update password
      </Button>
      <Button variant="outlined" icon={LogOut} onPress={signOut}>
        Sign out
      </Button>
    </YStack>
  );
}
