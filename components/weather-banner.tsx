import { memo, useMemo } from 'react';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';
import { Image } from 'expo-image';

import { IconSymbol } from './ui/icon-symbol';
import type { WeatherSnapshot } from '@/hooks/use-weather';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface WeatherBannerProps {
  loading: boolean;
  error: string | null;
  weather: WeatherSnapshot | null;
  onRetry: () => void;
}

const WeatherBannerComponent = ({ loading, error, weather, onRetry }: WeatherBannerProps) => {
  const colorScheme = useColorScheme();
  const accentColor = Colors[colorScheme ?? 'light'].tint;

  const formattedDate = useMemo(() => {
    const date = weather?.updatedAt ?? new Date();

    try {
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date.toDateString();
    }
  }, [weather?.updatedAt]);

  const temperatureLabel = weather
    ? `${Math.round(weather.temperature)}°${weather.units === 'metric' ? 'C' : 'F'}`
    : '--';

  const feelsLikeLabel = weather
    ? `Feels like ${Math.round(weather.feelsLike)}°${weather.units === 'metric' ? 'C' : 'F'}`
    : '';

  if (error) {
    return (
      <YStack
        padding="$4"
        borderRadius="$6"
        backgroundColor="$backgroundFocus"
        space="$3"
      >
        <XStack space="$2" alignItems="center">
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color={accentColor} />
          <Text fontWeight="600">Weather unavailable</Text>
        </XStack>
        <Text color="$color" opacity={0.8}>
          {error}
        </Text>
        <Button size="$3" onPress={onRetry} alignSelf="flex-start">
          Try again
        </Button>
      </YStack>
    );
  }

  return (
    <XStack
      padding="$4"
      borderRadius="$6"
      backgroundColor="$backgroundFocus"
      alignItems="center"
      justifyContent="space-between"
      minHeight={130}
    >
      <YStack space="$1.5" maxWidth="70%">
        <Text fontSize="$2" color="$color" opacity={0.7}>
          {formattedDate}
        </Text>
        <Text fontSize="$8" fontWeight="800">
          {temperatureLabel}
        </Text>
        <Text fontSize="$4" fontWeight="600">
          {weather?.locationName ?? 'Locating you…'}
        </Text>
        <Text color="$color" opacity={0.8}>
          {weather?.description ?? 'Fetching local forecast'}
        </Text>
        {!!feelsLikeLabel && (
          <Text fontSize="$2" color="$color" opacity={0.7}>
            {feelsLikeLabel}
          </Text>
        )}
      </YStack>

      {loading ? (
        <Spinner size="large" color={accentColor} />
      ) : weather?.icon ? (
        <Image
          source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@4x.png` }}
          style={{ width: 96, height: 96 }}
          contentFit="contain"
          recyclingKey={weather.icon}
        />
      ) : (
        <IconSymbol name="cloud.fill" size={48} color={accentColor} />
      )}
    </XStack>
  );
};

export const WeatherBanner = memo(WeatherBannerComponent);
