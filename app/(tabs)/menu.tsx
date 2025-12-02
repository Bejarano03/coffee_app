import MenuCard from "@/components/menu-card";
import { MENU_CATEGORIES, MENU_ITEMS } from "@/constants/menu";
import { useCart } from "@/context/CartContext";
import { MenuCategory } from "@/types/menu";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

const Menu = () => {
  const [category, setCategory] = useState<MenuCategory>(MENU_CATEGORIES[0].id);
  const { itemsById, addItem, decrementItem, subtotal, totalQuantity } = useCart();

  const itemsToDisplay = useMemo(
    () => MENU_ITEMS.filter((item) => item.category === category),
    [category]
  );

  return (
    <ScrollView flex={1} padding="$4" contentContainerStyle={styles.container}>
      <YStack space="$4">
        <YStack space="$1">
          <Text fontSize="$8" fontWeight="800">
            Our menu
          </Text>
          <Text fontSize="$4" color="$color" opacity={0.75}>
            Browse our latest coffees and fresh pastries. Tap “Add to cart” to save your favorites.
          </Text>
        </YStack>

        <XStack gap="$2">
          {MENU_CATEGORIES.map((menuCategory) => {
            const isActive = menuCategory.id === category;
            return (
              <Button
                key={menuCategory.id}
                borderRadius="$8"
                size="$3"
                variant={isActive ? "solid" : "outlined"}
                onPress={() => setCategory(menuCategory.id)}
              >
                {menuCategory.label}
              </Button>
            );
          })}
        </XStack>

        <YStack space="$3">
          {itemsToDisplay.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              quantity={itemsById[item.id]?.quantity ?? 0}
              onAdd={() => addItem(item)}
              onIncrement={() => addItem(item)}
              onDecrement={() => decrementItem(item.id)}
            />
          ))}
        </YStack>
      </YStack>

      {totalQuantity > 0 && (
        <Button marginTop="$4" size="$4" onPress={() => router.push("/(tabs)/cart")}>
          View cart · {totalQuantity} {totalQuantity === 1 ? "item" : "items"} · $
          {subtotal.toFixed(2)}
        </Button>
      )}
    </ScrollView>
  );
};

export default Menu;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
});
