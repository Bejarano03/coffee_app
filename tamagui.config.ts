import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

const blueLightTheme = {
  ...defaultConfig.themes.light,
  background: '#F2F6FC',
  backgroundHover: '#E9F0FB',
  backgroundPress: '#DDE5F4',
  backgroundFocus: '#CFDAEE',
  backgroundStrong: '#E6EEF9',
  borderColor: '#CBD5F5',
  color: '#101828',
  colorHover: '#0F172A',
  colorPress: '#0B1120',
};

const nightTheme = {
  ...defaultConfig.themes.dark,
  background: '#0B111F',
  backgroundHover: '#11192B',
  backgroundPress: '#0F1624',
  backgroundFocus: '#142038',
  backgroundStrong: '#121A2C',
  borderColor: '#1F2A3F',
  color: '#F7FAFF',
  colorHover: '#FFFFFF',
  colorPress: '#E7ECFF',
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    blueLight: blueLightTheme,
    night: nightTheme,
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
