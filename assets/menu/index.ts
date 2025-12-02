import { ImageSourcePropType } from 'react-native';

const menuImages: Record<string, ImageSourcePropType> = {
  default: require('@/assets/menu/default.png'),
  // Example mappings:
  // 'espresso-classic': require('@/assets/menu/espresso-classic.png'),
  // 'iced-oat-latte': require('@/assets/menu/iced-oat-latte.png'),
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
