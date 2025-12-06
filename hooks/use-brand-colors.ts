import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const BRAND_TOKENS = {
  light: {
    accent: '#2E56FF',
    accentHover: '#1F3FCC',
    accentPress: '#172FA0',
    onAccent: '#F7FAFF',
    mutedSurface: '#E7ECFF',
    mutedSurfaceHover: '#D8E0FF',
    border: '#C5D0FF',
    overlay: 'rgba(5, 10, 24, 0.55)',
    sheet: '#FFFFFF',
  },
  dark: {
    accent: '#7AB8FF',
    accentHover: '#9DCBFF',
    accentPress: '#5A9EE4',
    onAccent: '#041527',
    mutedSurface: '#1A2642',
    mutedSurfaceHover: '#223156',
    border: '#2B3F63',
    overlay: 'rgba(0, 0, 0, 0.65)',
    sheet: '#0F1A2E',
  },
} as const;

export const useBrandColors = () => {
  const scheme = useColorScheme() ?? 'light';
  const tokens = BRAND_TOKENS[scheme];

  return {
    ...tokens,
    scheme,
    text: Colors[scheme].text,
    background: Colors[scheme].background,
  };
};

export const getPrimaryButtonStyles = (brand: ReturnType<typeof useBrandColors>) => ({
  backgroundColor: brand.accent,
  color: brand.onAccent,
  borderColor: 'transparent',
  hoverStyle: { backgroundColor: brand.accentHover },
  pressStyle: { backgroundColor: brand.accentPress },
});

export const getOutlineButtonStyles = (brand: ReturnType<typeof useBrandColors>) => ({
  backgroundColor: 'transparent',
  color: brand.text,
  borderColor: brand.border,
  hoverStyle: { backgroundColor: brand.mutedSurface },
  pressStyle: { backgroundColor: brand.mutedSurfaceHover },
});

export const getSurfaceButtonStyles = (brand: ReturnType<typeof useBrandColors>) => ({
  backgroundColor: brand.mutedSurface,
  color: brand.accent,
  borderColor: 'transparent',
  hoverStyle: { backgroundColor: brand.mutedSurfaceHover },
  pressStyle: { backgroundColor: brand.mutedSurfaceHover },
});
