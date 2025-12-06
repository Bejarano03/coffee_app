import { Tabs, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import HomeHeader from "@/components/home-header";
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ProfileAPI } from '@/api/client';
import { AssistantOverlay } from '@/components/assistant/assistant-overlay';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { totalQuantity } = useCart();
  const { user, session } = useAuth();
  const [profileName, setProfileName] = useState<string | undefined>();
  const [assistantVisible, setAssistantVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;

    if (!session) {
      setProfileName(undefined);
      return;
    }

    ProfileAPI.fetchProfile()
      .then((profile) => {
        if (!isMounted) return;
        const primaryName =
          profile.firstName?.trim().split(' ')[0] ??
          profile.lastName?.trim().split(' ')[0];
        setProfileName(primaryName || profile.email);
      })
      .catch((error) => {
        console.warn('Failed to fetch profile for greeting', error);
        if (!isMounted) return;
        setProfileName(user?.email);
      });

    return () => {
      isMounted = false;
    };
  }, [session, user?.email]);

  const userName = profileName ?? user?.email ?? undefined;
  const navigateToProfile = () => {
      // Use router.push to go to the profile screen (which is at /profile)
      router.push('/profile');
  };

  const fabStyle = useMemo(
    () => [
      styles.fab,
      {
        backgroundColor: tintColor,
        bottom: Math.max(insets.bottom, 16) + 72,
      },
    ],
    [insets.bottom, tintColor],
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          headerTitle: () => <HomeHeader iconColor={tintColor} onProfilePress={navigateToProfile} userName={userName} />,
          headerTitleContainerStyle: {
            left: 0,
            right: 0,
            width: '100%',
            paddingHorizontal: 0,
            paddingRight: Platform.select({ ios: 0, android: 16 }),
          },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          headerShown: true,
          headerTitle: 'Coffee App Menu',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerShown: true,
          tabBarBadge: totalQuantity > 0 ? Math.min(totalQuantity, 99) : undefined,
          tabBarBadgeStyle: {
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            fontSize: 12,
          },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
    </Tabs>
      <TouchableOpacity
        style={fabStyle}
        activeOpacity={0.85}
        onPress={() => setAssistantVisible(true)}
        accessibilityLabel="Open Coffee Companion assistant"
      >
        <MaterialCommunityIcons name="robot-excited-outline" size={26} color="#fff" />
      </TouchableOpacity>
      <AssistantOverlay visible={assistantVisible} onClose={() => setAssistantVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
