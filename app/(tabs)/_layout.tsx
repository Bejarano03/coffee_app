import { Tabs, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import HomeHeader from "@/components/home-header";
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ProfileAPI } from '@/api/client';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { totalQuantity } = useCart();
  const { user, session } = useAuth();
  const [profileName, setProfileName] = useState<string | undefined>();

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

  return (
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
          },
          headerStyle: {
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
  );
}
