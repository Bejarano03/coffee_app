import MenuCard from "@/components/menu-card";
import { MenuAPI } from "@/api/client";
import { MENU_CATEGORIES } from "@/constants/menu";
import { useCart } from "@/context/CartContext";
import { MenuCategory, MenuItem } from "@/types/menu";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

const Menu = () => {
  const [category, setCategory] = useState<MenuCategory>(MENU_CATEGORIES[0].id);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { itemsById, addItem, decrementItem, subtotal, totalQuantity } = useCart();

  const fetchMenu = useCallback(
    async (useRefreshState = false) => {
      if (useRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await MenuAPI.list(category);
        setItems(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load menu", err);
        setError("Unable to load the menu right now. Pull to refresh to try again.");
      } finally {
        if (useRefreshState) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [category]
  );

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleRefresh = useCallback(() => {
    fetchMenu(true).catch(() => {});
  }, [fetchMenu]);

  const renderContent = useMemo(() => {
    if (isLoading) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" space="$2">
          <ActivityIndicator />
          <Text color="$color" opacity={0.75}>
            Loading menu…
          </Text>
        </YStack>
      );
    }

    if (!items.length) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" space="$2">
          <Text fontSize="$6" fontWeight="700">
            No items found
          </Text>
          <Text color="$color" opacity={0.75} textAlign="center">
            We couldn’t find anything in this category. Pull down to refresh or pick another tab.
          </Text>
        </YStack>
      );
    }

    return (
      <YStack space="$3">
        {items.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            quantity={itemsById[item.id]?.quantity ?? 0}
            onAdd={() => void addItem(item)}
            onIncrement={() => void addItem(item)}
            onDecrement={() => void decrementItem(item.id)}
          />
        ))}
      </YStack>
    );
  }, [addItem, decrementItem, isLoading, items, itemsById]);

  return (
    <ScrollView
      flex={1}
      padding="$4"
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      <YStack space="$4" flex={1}>
        <YStack space="$1">
          <Text fontSize="$8" fontWeight="800">
            Our menu
          </Text>
          <Text fontSize="$4" color="$color" opacity={0.75}>
            Browse coffees and pastries from the bar. Tap “Add to cart” to save your favorites.
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

        {error ? (
          <Text color="$red10" fontSize="$3">
            {error}
          </Text>
        ) : null}

        {renderContent}
      </YStack>

      {totalQuantity > 0 && (
        <Button marginTop="$4" size="$4" onPress={() => router.push("/(tabs)/cart")}>
          View cart · {totalQuantity} {totalQuantity === 1 ? "item" : "items"} · ${subtotal.toFixed(2)}
        </Button>
      )}
    </ScrollView>
  );
};

export default Menu;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
