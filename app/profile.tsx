import { LogOut, Save } from '@tamagui/lucide-icons';
import React, { useEffect, useState } from 'react';
import { AlertDialog, Button, H1, Input, Separator, Spinner, Text, XStack, YStack } from 'tamagui';

import { ProfileAPI, UpdateProfileData, UserProfile } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateData, setUpdateData] = useState<UpdateProfileData>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // State for alert visibility
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');


  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await ProfileAPI.fetchProfile();
        setProfile(userProfile);
        // Initialize updateData with current values for input fields
        const initialUpdateData: UpdateProfileData = {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            birthDate: userProfile.birthDate,
            phone: userProfile.phone,
        };
        setUpdateData(initialUpdateData);
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
  
  // --- Update Handler ---
  const handleUpdate = async () => {
    setIsSaving(true);
    
    // Only send fields that might have changed
    const dataToSend: UpdateProfileData = {};
    if (updateData.firstName !== profile?.firstName) dataToSend.firstName = updateData.firstName;
    if (updateData.lastName !== profile?.lastName) dataToSend.lastName = updateData.lastName;
    if (updateData.birthDate !== profile?.birthDate) dataToSend.birthDate = updateData.birthDate;
    if (updateData.phone !== profile?.phone) dataToSend.phone = updateData.phone;
    
    // If nothing changed, don't hit the API
    if (Object.keys(dataToSend).length === 0) {
        setAlertTitle('No Change');
        setAlertMessage('No fields were modified.');
        setShowAlert(true);
        setIsSaving(false);
        return;
    }
    
    try {
      const updatedProfile = await ProfileAPI.updateProfile(dataToSend);
      setProfile(updatedProfile); // Update local state with fresh data
      
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
  
  // Handle text input changes
  const handleChange = (key: keyof UpdateProfileData, value: string) => {
    setUpdateData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4">Loading Profile...</Text>
      </YStack>
    );
  }

  // Fallback if profile is null after loading (shouldn't happen with error handling)
  if (!profile) {
    return (
        <YStack flex={1} justifyContent="center" alignItems="center">
            <Text>Could not load user profile.</Text>
            <Button theme="red" onPress={signOut} marginTop="$4">Log Out</Button>
        </YStack>
    );
  }

  return (
    <YStack flex={1} padding="$4" backgroundColor="$background">
      <YStack 
        width="100%" 
        maxWidth={600} 
        marginHorizontal="auto" 
        space="$4" 
        padding="$4" 
        borderRadius="$8" 
        backgroundColor="$backgroundStrong" 
        shadowColor="$shadowColor" 
        shadowRadius={10}
      >
        
        <H1 textAlign="center" color="$color">My Profile</H1>
        <Text textAlign="center" color="$colorAcyclic">User ID: {profile.id}</Text>
        <Separator />
        
        <Text color="$colorAcyclic" fontWeight="bold">Email (Cannot be changed)</Text>
        <Input
            value={profile.email}
            disabled
            backgroundColor="$background"
            opacity={0.6}
        />
        
        {/* First Name */}
        <Text color="$colorAcyclic" fontWeight="bold">First Name</Text>
        <Input
          placeholder="First Name"
          value={updateData.firstName}
          onChangeText={(text) => handleChange('firstName', text)}
          size="$4"
        />

        {/* Last Name */}
        <Text color="$colorAcyclic" fontWeight="bold">Last Name</Text>
        <Input
          placeholder="Last Name"
          value={updateData.lastName}
          onChangeText={(text) => handleChange('lastName', text)}
          size="$4"
        />

        {/* Birth Date */}
        <Text color="$colorAcyclic" fontWeight="bold">Birth Date</Text>
        <Input
          placeholder="YYYY-MM-DD"
          value={updateData.birthDate}
          onChangeText={(text) => handleChange('birthDate', text)}
          size="$4"
        />

        {/* Phone */}
        <Text color="$colorAcyclic" fontWeight="bold">Phone Number</Text>
        <Input
          placeholder="Phone"
          value={updateData.phone}
          onChangeText={(text) => handleChange('phone', text)}
          size="$4"
          keyboardType="phone-pad"
        />
        
        <Button
          theme="active"
          iconAfter={Save}
          onPress={handleUpdate}
          disabled={isSaving}
          loading={isSaving}
          size="$5"
          marginTop="$4"
        >
          {isSaving ? 'Saving...' : 'Update Details'}
        </Button>
        
        <Separator />

        <Button
            theme="red"
            iconAfter={LogOut}
            onPress={signOut}
            size="$4"
        >
            Log Out
        </Button>

      </YStack>
      
      {/* Simple Tamagui Alert Dialog for feedback */}
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
                <H1 fontSize="$6">{alertTitle}</H1>
                <Text>{alertMessage}</Text>

                <XStack $sm={{ flexDirection: 'column' }} space>
                    <AlertDialog.Cancel asChild>
                        <Button onPress={() => setShowAlert(false)}>
                            Close
                        </Button>
                    </AlertDialog.Cancel>
                </XStack>
            </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  );
}