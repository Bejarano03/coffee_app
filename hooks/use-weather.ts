import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';

export interface WeatherSnapshot {
  locationName: string;
  description: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  icon: string | undefined;
  updatedAt: Date;
  units: 'metric' | 'imperial';
}

interface UseWeatherResult {
  loading: boolean;
  error: string | null;
  weather: WeatherSnapshot | null;
  refresh: () => Promise<void>;
}

const WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_UNITS: WeatherSnapshot['units'] = 'imperial';
const WEATHER_CACHE_KEY = 'weather:lastSnapshot';
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

const isCacheStale = (snapshot: WeatherSnapshot | null) => {
  if (!snapshot) {
    return true;
  }

  const age = Date.now() - snapshot.updatedAt.getTime();
  return age > WEATHER_CACHE_TTL_MS;
};

async function readWeatherCache(): Promise<WeatherSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const updatedAt = parsed?.updatedAt ? new Date(parsed.updatedAt) : null;

    if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
      return null;
    }

    return {
      locationName: parsed.locationName,
      description: parsed.description,
      temperature: parsed.temperature,
      feelsLike: parsed.feelsLike,
      humidity: parsed.humidity,
      icon: parsed.icon,
      updatedAt,
      units: parsed.units ?? WEATHER_UNITS,
    };
  } catch (error) {
    console.warn('Failed to read cached weather data', error);
    return null;
  }
}

async function writeWeatherCache(snapshot: WeatherSnapshot) {
  try {
    await AsyncStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({
        ...snapshot,
        updatedAt: snapshot.updatedAt.toISOString(),
      }),
    );
  } catch (error) {
    console.warn('Failed to persist weather cache', error);
  }
}

const parseFallbackCoords = (): Location.LocationObjectCoords | null => {
  const fallbackRaw = process.env.EXPO_PUBLIC_WEATHER_FALLBACK_COORDS;

  if (!fallbackRaw) return null;

  const [latString, lonString] = fallbackRaw.split(',');
  const latitude = Number.parseFloat(latString?.trim() ?? '');
  const longitude = Number.parseFloat(lonString?.trim() ?? '');

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.warn('Invalid fallback coordinates. Expected "lat,lon" format.');
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: 1000,
    altitude: 0,
    heading: 0,
    speed: 0,
    altitudeAccuracy: null,
  } as Location.LocationObjectCoords;
};

const toTitleCase = (value: string | undefined) =>
  value?.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1)) ?? '';

async function fetchCoordinates(): Promise<Location.LocationObjectCoords> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    const fallback = parseFallbackCoords();
    if (fallback) return fallback;
    throw new Error('Location permission is required to show local weather.');
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    const fallback = parseFallbackCoords();
    if (fallback) return fallback;
    throw new Error('Enable device location services to view the forecast.');
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
      mayShowUserSettingsDialog: true,
    });

    return position.coords;
  } catch (error) {
    const fallback = parseFallbackCoords();
    if (fallback) {
      console.warn('Falling back to static coordinates for weather preview.', error);
      return fallback;
    }

    throw error instanceof Error
      ? error
      : new Error('Unable to determine current location.');
  }
}

async function fetchWeatherForCoords(coords: Location.LocationObjectCoords): Promise<WeatherSnapshot> {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OpenWeather API key. Add EXPO_PUBLIC_OPENWEATHER_API_KEY to your .env file.');
  }

  const query = new URLSearchParams({
    lat: coords.latitude.toString(),
    lon: coords.longitude.toString(),
    units: WEATHER_UNITS,
    appid: apiKey,
  });

  const response = await fetch(`${WEATHER_ENDPOINT}?${query.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to load weather data.');
  }

  const payload = await response.json();

  return {
    locationName: payload.name || 'Your area',
    description: toTitleCase(payload.weather?.[0]?.description) || 'Unknown conditions',
    temperature: payload.main?.temp ?? 0,
    feelsLike: payload.main?.feels_like ?? payload.main?.temp ?? 0,
    humidity: payload.main?.humidity ?? 0,
    icon: payload.weather?.[0]?.icon,
    updatedAt: new Date(),
    units: WEATHER_UNITS,
  };
}

export const useWeather = (): UseWeatherResult => {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const coords = await fetchCoordinates();
      const snapshot = await fetchWeatherForCoords(coords);

      if (!isMounted.current) return;

      setWeather(snapshot);
      await writeWeatherCache(snapshot);
    } catch (err) {
      if (!isMounted.current) return;

      const message = err instanceof Error ? err.message : 'Unknown error while loading weather.';
      setError(message);
      setWeather(null);
    } finally {
      if (!isMounted.current) return;

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromCache = async () => {
      if (cancelled || !isMounted.current) return;

      setLoading(true);
      const cached = await readWeatherCache();

      if (!isMounted.current || cancelled) {
        return;
      }

      if (cached) {
        setWeather(cached);
      }

      if (isCacheStale(cached)) {
        await refresh();
      } else {
        setLoading(false);
      }
    };

    hydrateFromCache().catch((error) => {
      if (cancelled || !isMounted.current) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error while loading weather.';
      setError(message);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return useMemo(
    () => ({
      loading,
      error,
      weather,
      refresh,
    }),
    [loading, error, weather, refresh],
  );
};
