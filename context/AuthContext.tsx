import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useSegments } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AuthContextType, JwtPayload } from '../types/auth';

// --- Constants for AsyncStorage Keys ---
const TOKEN_KEY = 'userToken';
const USER_DATA_KEY = 'userData';

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
  
  // Get current route segments for redirection logic
  const segments = useSegments() as string[]; 

  // 1. Initial Load: Check AsyncStorage for Token and User Data
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
        
        setSession(token);
        
        if (userDataString) {
          const userData: JwtPayload = JSON.parse(userDataString);
          setUser(userData);
        }
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

    if (session && inAuthGroup) {
      // User is logged in AND on a public screen -> Redirect to Tabs
      router.replace('/(tabs)');
    } else if (!session && !inAuthGroup) {
      // User is logged out AND trying to access a protected screen -> Redirect to Login
      router.replace('(auth)/login' as any);
    }
  }, [session, isLoading, segments]);


  // 3. Context Value and Functions
  const authContextValue: AuthContextType = {
    session,
    user,
    isLoading,
    
    // Handles successful login/signup response from NestJS
    signIn: async (token: string, payload: JwtPayload) => {
      // 1. Store the token and user payload securely
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(payload));
      
      // 2. Update local state (triggers the useEffect redirect to /(tabs))
      setSession(token);
      setUser(payload);
    },

    // Note: If sign up logic is different, implement it here. Otherwise, it can call signIn.
    signUp: async (token: string, payload: JwtPayload) => {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(payload));
      setSession(token);
      setUser(payload);
    },
    
    // Clears all storage and state
    signOut: async () => {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_DATA_KEY);
      } catch (e) {
        console.error("Failed to clear storage on sign out:", e);
      } finally {
        // Clear state (triggers the useEffect redirect to /(auth)/login)
        setSession(null);
        setUser(null);
      }
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