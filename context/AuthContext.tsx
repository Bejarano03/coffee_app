import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AuthContextType, AuthStateOptions, JwtPayload } from '../types/auth';

// --- Constants for AsyncStorage Keys ---
const TOKEN_KEY = 'userToken';
const USER_DATA_KEY = 'userData';
const PASSWORD_RESET_REQUIRED_KEY = 'passwordResetRequired';

// 1. Create the Context
// Initialize with null, and the useAuth hook will ensure it's not null at runtime.
export const AuthContext = createContext<AuthContextType | null>(null);

// 2. Custom Hook to use the Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // This throws if useAuth is called outside of the AuthProvider.
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}

// 3. The Auth Provider Component
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);
  
  // Get current route segments for redirection logic
  const segments = useSegments() as string[]; 

  // 1. Initial Load: Check AsyncStorage for Token and User Data
  useEffect(() => {
    const checkToken = async () => {
      try {
        const [token, userDataString, requiresResetFlag] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_DATA_KEY),
          AsyncStorage.getItem(PASSWORD_RESET_REQUIRED_KEY),
        ]);
        
        setSession(token);
        
        if (userDataString) {
          const userData: JwtPayload = JSON.parse(userDataString);
          setUser(userData);
        }

        setRequiresPasswordReset(requiresResetFlag === 'true');
      } catch (e) {
        console.error("Failed to load auth state:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  // 2. Expo Router Redirection Logic (The Guard)
  useEffect(() => {
    if (isLoading) return; // Wait until initial check is complete

    // Check if the current route is inside the (auth) group
    const inAuthGroup = segments[0] === '(auth)'; 
    const isOnResetScreen = inAuthGroup && segments[1] === 'reset-password';

    if (session && requiresPasswordReset) {
      if (!isOnResetScreen) {
        router.replace('(auth)/reset-password' as any);
      }
      return;
    }

    if (session && inAuthGroup) {
      // User is logged in AND on a public screen -> Redirect to Tabs
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // User is logged out AND trying to access a protected screen -> Redirect to Login
      router.replace('(auth)/login' as any);
    }
  }, [session, isLoading, segments, requiresPasswordReset]);


  // 3. Context Value and Functions
  const authContextValue: AuthContextType = {
    session,
    user,
    isLoading,
    requiresPasswordReset,
    
    // Handles successful login/signup response from NestJS
    signIn: async (token: string, payload: JwtPayload, options?: AuthStateOptions) => {
      // 1. Store the token and user payload securely
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(payload));

      const needsPasswordReset = !!options?.requiresPasswordReset;
      if (needsPasswordReset) {
        await AsyncStorage.setItem(PASSWORD_RESET_REQUIRED_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(PASSWORD_RESET_REQUIRED_KEY);
      }
      setRequiresPasswordReset(needsPasswordReset);
      
      // 2. Update local state (triggers the useEffect redirect to /(tabs))
      setSession(token);
      setUser(payload);
    },

    // Note: If sign up logic is different, implement it here. Otherwise, it can call signIn.
    signUp: async (token: string, payload: JwtPayload, options?: AuthStateOptions) => {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(payload));
      if (options?.requiresPasswordReset) {
        await AsyncStorage.setItem(PASSWORD_RESET_REQUIRED_KEY, 'true');
        setRequiresPasswordReset(true);
      } else {
        await AsyncStorage.removeItem(PASSWORD_RESET_REQUIRED_KEY);
        setRequiresPasswordReset(false);
      }
      setSession(token);
      setUser(payload);
    },
    
    // Clears all storage and state
    signOut: async () => {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_DATA_KEY);
        await AsyncStorage.removeItem(PASSWORD_RESET_REQUIRED_KEY);
      } catch (e) {
        console.error("Failed to clear storage on sign out:", e);
      } finally {
        // Clear state (triggers the useEffect redirect to /(auth)/login)
        setSession(null);
        setUser(null);
        setRequiresPasswordReset(false);
      }
    },

    markPasswordResetComplete: async () => {
      await AsyncStorage.removeItem(PASSWORD_RESET_REQUIRED_KEY);
      setRequiresPasswordReset(false);
    },
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {/* Optionally, show a splash screen or loading indicator while 'isLoading' is true */}
      {/* {isLoading ? <YourLoadingComponent /> : children} */}
      {children}
    </AuthContext.Provider>
  );
}
