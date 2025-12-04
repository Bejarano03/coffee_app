import { ArrowLeft, LogOut, Save } from '@tamagui/lucide-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertDialog,
  Button,
  Card,
  Input,
  ScrollView,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui';

import { router, useNavigation } from 'expo-router';
import { ProfileAPI, UpdateProfileData, UserProfile } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import {
  formatBirthDateInput,
  formatPhoneInput,
  isCompleteBirthDate,
  normalizeBirthDateFromServer,
  normalizePhoneNumber,
} from '@/utils/formatters';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 24);
  const bottomPadding = Math.max(insets.bottom, 24);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateData, setUpdateData] = useState<UpdateProfileData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const prepareProfileForUi = useCallback((userProfile: UserProfile): UserProfile => {
    return {
      ...userProfile,
      birthDate: normalizeBirthDateFromServer(userProfile.birthDate),
      phone: formatPhoneInput(userProfile.phone),
    };
  }, []);

  const applyProfileState = useCallback((userProfile: UserProfile) => {
    const prepared = prepareProfileForUi(userProfile);
    setProfile(prepared);
    setUpdateData({
      firstName: prepared.firstName,
      lastName: prepared.lastName,
      birthDate: prepared.birthDate,
      phone: prepared.phone,
    });
  }, [prepareProfileForUi]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await ProfileAPI.fetchProfile();
        applyProfileState(userProfile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setAlertTitle('Error');
        setAlertMessage('Failed to load profile data. Please try again.');
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [applyProfileState]);

  const handleUpdate = async () => {
    setIsSaving(true);

    if (updateData.birthDate && !isCompleteBirthDate(updateData.birthDate)) {
      setAlertTitle('Invalid date');
      setAlertMessage('Birthdate must follow MM-DD-YYYY.');
      setShowAlert(true);
      setIsSaving(false);
      return;
    }

    const normalizedPhoneInput = updateData.phone ? normalizePhoneNumber(updateData.phone) : '';
    const profilePhoneDigits = profile?.phone ? normalizePhoneNumber(profile.phone) : '';

    if (updateData.phone && normalizedPhoneInput.length !== 10) {
      setAlertTitle('Invalid phone');
      setAlertMessage('Phone number must include 10 digits.');
      setShowAlert(true);
      setIsSaving(false);
      return;
    }

    const dataToSend: UpdateProfileData = {};
    if (updateData.firstName !== profile?.firstName) dataToSend.firstName = updateData.firstName;
    if (updateData.lastName !== profile?.lastName) dataToSend.lastName = updateData.lastName;
    if (updateData.birthDate !== profile?.birthDate) dataToSend.birthDate = updateData.birthDate;
    if (normalizedPhoneInput && normalizedPhoneInput !== profilePhoneDigits) {
      dataToSend.phone = normalizedPhoneInput;
    }

    if (Object.keys(dataToSend).length === 0) {
      setAlertTitle('No Change');
      setAlertMessage('No fields were modified.');
      setShowAlert(true);
      setIsSaving(false);
      return;
    }

    try {
      const updatedProfile = await ProfileAPI.updateProfile(dataToSend);
      applyProfileState(updatedProfile);
      setAlertTitle('Success');
      setAlertMessage('Profile updated successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to update profile. Please check your data.');
      setShowAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof UpdateProfileData, value: string) => {
    setUpdateData((prev) => ({ ...prev, [key]: value }));
  };

  const handleBirthDateInput = (value: string) => {
    setUpdateData((prev) => ({ ...prev, birthDate: formatBirthDateInput(value) }));
  };

  const handlePhoneInput = (value: string) => {
    setUpdateData((prev) => ({ ...prev, phone: formatPhoneInput(value) }));
  };

  const handlePasswordInput = (key: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setAlertTitle('Missing info');
      setAlertMessage('Please fill in all password fields.');
      setShowAlert(true);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlertTitle('Mismatch');
      setAlertMessage('New password and confirmation must match.');
      setShowAlert(true);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await ProfileAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setAlertTitle('Password updated');
      setAlertMessage('Your password was updated successfully.');
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to update password:', error);
      const message = (error as any)?.response?.data?.message || 'Could not update password. Double-check your current password.';
      setAlertTitle('Error');
      setAlertMessage(message);
      setShowAlert(true);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayName = useMemo(() => {
    if (!profile) {
      return '';
    }
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email;
  }, [profile]);

  const initials = useMemo(() => {
    if (!displayName) {
      return '';
    }
    return displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [displayName]);

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4">Loading Profile...</Text>
      </YStack>
    );
  }

  if (!profile) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Could not load user profile.</Text>
        <Button theme="red" onPress={signOut} marginTop="$4">
          Log Out
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={topPadding} paddingBottom={bottomPadding}>
      <XStack alignItems="center" paddingHorizontal="$4" marginBottom="$2">
        <Pressable
          onPress={() => {
            if (typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              router.replace('/(tabs)');
            }
          }}
          hitSlop={8}
        >
          <XStack alignItems="center" gap="$2">
            <ArrowLeft size={20} />
            <Text fontWeight="700">Back</Text>
          </XStack>
        </Pressable>
      </XStack>
      <ScrollView
        flex={1}
        backgroundColor="$background"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <YStack
          flex={1}
          padding="$4"
          space="$4"
          width="100%"
          maxWidth={700}
          marginHorizontal="auto"
        >
          <Card padding="$4" backgroundColor="$backgroundStrong" bordered elevate>
            <XStack alignItems="center" gap="$4">
              <YStack
                width={72}
                height={72}
                borderRadius="$10"
                backgroundColor="$blue5"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="$7" fontWeight="700" color="$blue12">
                  {initials}
                </Text>
              </YStack>
              <YStack space="$1">
                <Text fontSize="$7" fontWeight="700">
                  {displayName}
                </Text>
                <Text color="$color8">{profile.email}</Text>
                <Text color="$color8" fontSize="$2">
                  User ID: {profile.id}
                </Text>
              </YStack>
            </XStack>
          </Card>

          <Card padding="$4" backgroundColor="$backgroundStrong" space="$4" bordered elevate>
            <Text fontSize="$5" fontWeight="700">
              Contact Details
            </Text>
            <Separator />

            <YStack space="$3">
              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Email (read only)
                </Text>
                <Input value={profile.email} disabled backgroundColor="$background" opacity={0.7} />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  First Name
                </Text>
                <Input
                  placeholder="First Name"
                  value={updateData.firstName}
                  onChangeText={(text) => handleChange('firstName', text)}
                  size="$4"
                />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Last Name
                </Text>
                <Input
                  placeholder="Last Name"
                  value={updateData.lastName}
                  onChangeText={(text) => handleChange('lastName', text)}
                  size="$4"
                />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Birth Date (MM-DD-YYYY)
                </Text>
                <Input
                  placeholder="MM-DD-YYYY"
                  value={updateData.birthDate}
                  onChangeText={handleBirthDateInput}
                  size="$4"
                  keyboardType="numbers-and-punctuation"
                />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Phone Number
                </Text>
                <Input
                  placeholder="(555) 555-1234"
                  value={updateData.phone}
                  onChangeText={handlePhoneInput}
                  size="$4"
                  keyboardType="phone-pad"
                />
              </YStack>
            </YStack>

            <XStack gap="$3" marginTop="$4">
              <Button
                flex={1}
                theme="active"
                iconAfter={Save}
                onPress={handleUpdate}
                disabled={isSaving}
                loading={isSaving}
                size="$4"
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>

              <Button theme="red" iconAfter={LogOut} onPress={signOut} size="$4">
                Log out
              </Button>
            </XStack>
          </Card>

          <Card padding="$4" backgroundColor="$backgroundStrong" space="$4" bordered elevate>
            <Text fontSize="$5" fontWeight="700">
              Security
            </Text>
            <Separator />

            <YStack space="$3">
              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Current password
                </Text>
                <Input
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChangeText={(value) => handlePasswordInput('currentPassword', value)}
                  secureTextEntry
                />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  New password
                </Text>
                <Input
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChangeText={(value) => handlePasswordInput('newPassword', value)}
                  secureTextEntry
                />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Confirm new password
                </Text>
                <Input
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChangeText={(value) => handlePasswordInput('confirmPassword', value)}
                  secureTextEntry
                />
              </YStack>
            </YStack>

            <Button
              theme="active"
              iconAfter={Save}
              onPress={handlePasswordUpdate}
              disabled={isUpdatingPassword}
              loading={isUpdatingPassword}
              size="$4"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update password'}
            </Button>
          </Card>
        </YStack>
      </ScrollView>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            key="overlay"
            animation="bouncy"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <AlertDialog.Content
            key="content"
            animation={[
              'bouncy',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            x={0}
            scale={1}
            opacity={1}
            y={0}
          >
            <Text fontSize="$6" fontWeight="700">
              {alertTitle}
            </Text>
            <Text marginTop="$2">{alertMessage}</Text>

            <XStack $sm={{ flexDirection: 'column' }} gap="$2" marginTop="$4">
              <AlertDialog.Cancel asChild>
                <Button onPress={() => setShowAlert(false)}>Close</Button>
              </AlertDialog.Cancel>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  );
}
