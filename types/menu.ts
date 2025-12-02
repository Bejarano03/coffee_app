export type MenuCategory = 'coffee' | 'pastry';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  tags?: string[];
  isAvailable?: boolean;
}
