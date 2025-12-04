import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalProvider } from '@tamagui/portal';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import 'react-native-reanimated';
import { TamaguiProvider } from 'tamagui';
import { View } from 'react-native';
import { tamaguiConfig } from '../tamagui.config';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Checkout will be disabled.');
  }

  const lightBackground = '#F2F6FC';
  const darkBackground = '#050A18';
  const rootBackground = colorScheme === 'dark' ? darkBackground : lightBackground;
  const tamaguiTheme = colorScheme === 'dark' ? 'night' : 'blueLight';
  const navigationTheme =
    colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: darkBackground,
            card: darkBackground,
            text: '#F7FAFF',
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: lightBackground,
            card: lightBackground,
          },
        };

  return (
    <StripeProvider
      publishableKey={publishableKey ?? ''}
      merchantIdentifier="merchant.com.coffeeclub.app"
      urlScheme="coffeeclub"
    >
      <TamaguiProvider config={tamaguiConfig} defaultTheme={tamaguiTheme}>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <View style={{ flex: 1, backgroundColor: rootBackground }}>
            <PortalProvider>
              <AuthProvider>
                <CartProvider>
                  <Slot />
                </CartProvider>
              </AuthProvider>
            </PortalProvider>
          </View>
        </ThemeProvider>
      </TamaguiProvider>
    </StripeProvider>
  );
}
