export type MenuCategory = 'COFFEE' | 'PASTRY';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageKey: string;
  tags?: string[];
  isAvailable?: boolean;
}
