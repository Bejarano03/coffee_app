import { UserPlus } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, ScrollView, Separator, Text, XStack, YStack } from 'tamagui';
import { getOutlineButtonStyles, getPrimaryButtonStyles, useBrandColors } from '@/hooks/use-brand-colors';

import { AuthAPI } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { JwtPayload } from '@/types/auth';
import {
  formatBirthDateInput,
  formatPhoneInput,
  isCompleteBirthDate,
  normalizePhoneNumber,
} from '@/utils/formatters';

export default function SignUpScreen() {
  // --- State for all fields ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth(); 

  const handleSignUp = async () => {
    setLoading(true);
    
    // Basic client-side validation for all required fields
    if (!email || !password || !confirmPassword || !firstName || !lastName || !birthDate || !phone) {
      Alert.alert('Error', 'All fields are required.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!isCompleteBirthDate(birthDate)) {
      Alert.alert('Error', 'Birthdate must follow MM-DD-YYYY.');
      setLoading(false);
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (normalizedPhone.length !== 10) {
      Alert.alert('Error', 'Phone number must contain 10 digits.');
      setLoading(false);
      return;
    }

    try {
      // 1. Call the centralized API function with all registration data
      const { access_token, email: userEmail, sub: userId } = await AuthAPI.signup({
        email,
        password,
        firstName,
        lastName,
        birthDate,
        phone: normalizedPhone,
      });
      
      if (access_token) {
        // 2. Store the session and redirect to the protected area
        const userPayload: JwtPayload = { email: userEmail, sub: userId };
        await signUp(access_token, userPayload);
      } else {
        Alert.alert('Sign Up Failed', 'Registration failed to return a token.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const brand = useBrandColors();
  const primaryButtonStyles = getPrimaryButtonStyles(brand);
  const outlineButtonStyles = getOutlineButtonStyles(brand);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        flex={1}
        backgroundColor="$background"
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background" paddingHorizontal="$4">
      <YStack 
        width="100%" 
        maxWidth={420} 
        space="$3" 
        padding="$6" 
        borderRadius="$8" 
        backgroundColor="$backgroundStrong" 
        shadowColor="$shadowColor" 
        shadowRadius={10}
      >
        <Text fontSize="$8" fontWeight="800" textAlign="center" color="$color">Coffee App</Text>
        <Text fontSize="$6" fontWeight="700" textAlign="center" color="$color">Create your café profile</Text>
        <Text textAlign="center" color="$color9">Join Coffee App to earn rewards and skip the line.</Text>
        
        <Separator />
        
        {/* First Name & Last Name (Side by Side using XStack) */}
        <XStack space="$3">
            <Input
              flex={1}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              size="$4"
            />
            <Input
              flex={1}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              size="$4"
            />
        </XStack>
        
        {/* Birthdate Input */}
        <Input
          placeholder="Birthdate (MM-DD-YYYY)"
          value={birthDate}
          onChangeText={(value) => setBirthDate(formatBirthDateInput(value))}
          keyboardType="numbers-and-punctuation"
          size="$4"
        />
        
        {/* Phone Number Input */}
        <Input
          placeholder="Phone Number"
          value={phone}
          onChangeText={(value) => setPhone(formatPhoneInput(value))}
          keyboardType="phone-pad"
          size="$4"
        />

        {/* Email Input */}
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          size="$4"
        />

        {/* Password Input */}
        <Input
          placeholder="Password (Min 6 chars)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          size="$4"
        />

        {/* Confirm Password Input */}
        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          size="$4"
        />

        {/* Sign Up Button */}
        <Button
          iconAfter={UserPlus}
          onPress={handleSignUp}
          disabled={loading}
          loading={loading}
          size="$5"
          marginTop="$2"
          {...primaryButtonStyles}
        >
          {loading ? 'Registering...' : 'Sign Up'}
        </Button>
        
        <XStack justifyContent="center" marginTop="$4" space="$2">
            <Text color="$color9">Already have an account?</Text>
            {/* Navigates to the login screen */}
            <Button 
                size="$2" 
                onPress={() => router.replace('/login')} 
                {...outlineButtonStyles}
            >
                Log In
            </Button>
        </XStack>
      </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
