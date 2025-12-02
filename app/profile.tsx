import { LogOut, Save } from '@tamagui/lucide-icons';
import React, { useEffect, useMemo, useState } from 'react';
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

import { ProfileAPI, UpdateProfileData, UserProfile } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateData, setUpdateData] = useState<UpdateProfileData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await ProfileAPI.fetchProfile();
        setProfile(userProfile);
        setUpdateData({
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          birthDate: userProfile.birthDate,
          phone: userProfile.phone,
        });
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
  }, []);

  const handleUpdate = async () => {
    setIsSaving(true);

    const dataToSend: UpdateProfileData = {};
    if (updateData.firstName !== profile?.firstName) dataToSend.firstName = updateData.firstName;
    if (updateData.lastName !== profile?.lastName) dataToSend.lastName = updateData.lastName;
    if (updateData.birthDate !== profile?.birthDate) dataToSend.birthDate = updateData.birthDate;
    if (updateData.phone !== profile?.phone) dataToSend.phone = updateData.phone;

    if (Object.keys(dataToSend).length === 0) {
      setAlertTitle('No Change');
      setAlertMessage('No fields were modified.');
      setShowAlert(true);
      setIsSaving(false);
      return;
    }

    try {
      const updatedProfile = await ProfileAPI.updateProfile(dataToSend);
      setProfile(updatedProfile);
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
    <YStack flex={1} backgroundColor="$background">
      <ScrollView flex={1} backgroundColor="$background">
        <YStack flex={1} padding="$4" space="$4" width="100%" maxWidth={700} marginHorizontal="auto">
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
                  Birth Date
                </Text>
                <Input
                  placeholder="YYYY-MM-DD"
                  value={updateData.birthDate}
                  onChangeText={(text) => handleChange('birthDate', text)}
                  size="$4"
                />
              </YStack>

              <YStack space="$1">
                <Text fontSize="$2" color="$color9">
                  Phone Number
                </Text>
                <Input
                  placeholder="Phone"
                  value={updateData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
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
