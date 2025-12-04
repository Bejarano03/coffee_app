import { ImageSourcePropType } from 'react-native';

const menuImages: Record<string, ImageSourcePropType> = {
  default: require('@/assets/menu/default.png'),
  'espresso-classic': require('@/assets/images/classic-espresso.png'),
  'iced-oat-latte': require('@/assets/images/ice-oat-latte.png'),
  'maple-cold-foam': require('@/assets/images/maple-cold-foam.png'),
  'mocha-delight': require('@/assets/images/mocha-delight.png'),
  'lemon-poppy-muffin': require('@/assets/images/lemon-poppy-muffin.png'),
  'almond-croissant': require('@/assets/images/almond-croissant.png'),
  'blueberry-scone': require('@/assets/images/blueberry-scone.png'),
  'cinnamon-roll': require('@/assets/images/warm-cinnamon-roll.png'),
  'pumpkin-spice-latte': require('@/assets/images/Pumpkin-Spice-Latte.png'),
  'winter-peppermint-mocha': require('@/assets/images/winter-peppermint-mocha.png'),
};

export const getMenuImageSource = (key?: string): ImageSourcePropType => {
  if (!key) {
    return menuImages.default;
  }

  return menuImages[key] ?? menuImages.default;
};

export const registerMenuImage = (key: string, source: ImageSourcePropType) => {
  menuImages[key] = source;
};
