import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

const blueLightTheme = {
  ...defaultConfig.themes.light,
  background: '#F2F6FC',
  backgroundHover: '#E9F0FB',
  backgroundPress: '#DDE5F4',
  backgroundFocus: '#CFDAEE',
  backgroundStrong: '#E6EEF9',
};

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    blueLight: blueLightTheme,
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
