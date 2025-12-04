import MenuCard from "@/components/menu-card";
import { MenuAPI, MilkOption } from "@/api/client";
import { MENU_CATEGORIES } from "@/constants/menu";
import { useCart } from "@/context/CartContext";
import { MenuCategory, MenuItem } from "@/types/menu";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, RefreshControl, StyleSheet } from "react-native";
import { Button, Input, ScrollView, Separator, Sheet, Text, XStack, YStack } from "tamagui";

const Menu = () => {
  const [category, setCategory] = useState<MenuCategory>(MENU_CATEGORIES[0].id);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { quantityByMenuItem, addItem, subtotal, totalQuantity } = useCart();
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultCustomization = useMemo(
    () => ({
      milkOption: "WHOLE" as MilkOption,
      espressoShots: 2,
      flavorName: "",
      flavorPumps: 0,
    }),
    []
  );
  const [customization, setCustomization] = useState(defaultCustomization);
  const [quantity, setQuantity] = useState(1);
  const milkOptions = useMemo(
    () => [
      { label: "Whole Milk", value: "WHOLE" as MilkOption },
      { label: "Half & Half", value: "HALF_AND_HALF" as MilkOption },
      { label: "Almond Milk", value: "ALMOND" as MilkOption },
      { label: "Oat Milk", value: "OAT" as MilkOption },
      { label: "Soy Milk", value: "SOY" as MilkOption },
    ],
    []
  );

  const resetCustomization = useCallback(() => {
    setCustomization({ ...defaultCustomization });
    setQuantity(1);
  }, [defaultCustomization]);

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

  const handleCustomizePress = useCallback(
    (item: MenuItem) => {
      if (item.category !== "COFFEE") {
        return;
      }

      setSelectedItem(item);
      setCustomization({ ...defaultCustomization });
      setQuantity(1);
      setCustomizationOpen(true);
    },
    [defaultCustomization]
  );

  const handleAddReadyItem = useCallback(
    (item: MenuItem) => {
      addItem(item).catch((error) => {
        console.error("Failed to add pastry", error);
        Alert.alert("Unable to add item", "Please try again.");
      });
    },
    [addItem]
  );

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
        {items.map((item) => {
          const isCoffee = item.category === "COFFEE";
          const actionHandler = isCoffee ? () => handleCustomizePress(item) : () => handleAddReadyItem(item);

          return (
            <MenuCard
              key={item.id}
              item={item}
              quantity={quantityByMenuItem[item.id]}
              onCardPress={isCoffee ? actionHandler : undefined}
              onActionPress={actionHandler}
              isCustomizable={isCoffee}
            />
          );
        })}
      </YStack>
    );
  }, [handleAddReadyItem, handleCustomizePress, isLoading, items, quantityByMenuItem]);

  const handleAdjustShots = useCallback((delta: number) => {
    setCustomization((prev) => {
      const next = Math.max(1, Math.min(6, prev.espressoShots + delta));
      return { ...prev, espressoShots: next };
    });
  }, []);

  const handleAdjustFlavorPumps = useCallback((delta: number) => {
    setCustomization((prev) => {
      const next = Math.max(0, Math.min(8, (prev.flavorPumps ?? 0) + delta));
      return { ...prev, flavorPumps: next };
    });
  }, []);

  const handleAdjustQuantity = useCallback((delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(12, prev + delta)));
  }, []);

  const handleCloseSheet = useCallback(
    (open: boolean) => {
      setCustomizationOpen(open);
      if (!open) {
        setSelectedItem(null);
        resetCustomization();
      }
    },
    [resetCustomization]
  );

  useEffect(() => {
    if (!customizationOpen) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleCloseSheet(false);
      return true;
    });

    return () => subscription.remove();
  }, [customizationOpen, handleCloseSheet]);

  const handleSubmit = useCallback(async () => {
    if (!selectedItem) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addItem(selectedItem, {
        quantity,
        customizations: {
          milkOption: customization.milkOption,
          espressoShots: customization.espressoShots,
          flavorName: customization.flavorName?.trim() || undefined,
          flavorPumps:
            customization.flavorName?.trim() && customization.flavorName.trim().length > 0
              ? customization.flavorPumps
              : undefined,
        },
      });
      handleCloseSheet(false);
    } catch (error) {
      console.error("Failed to add customized drink", error);
      Alert.alert("Unable to add drink", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [addItem, customization, handleCloseSheet, quantity, selectedItem]);

  return (
    <>
      <ScrollView
        flex={1}
        padding="$4"
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <YStack space="$4" flex={1}>
          <YStack space="$1">
            <Text fontSize="$8" fontWeight="800">
              Coffee App Menu
            </Text>
            <Text fontSize="$4" color="$color" opacity={0.75}>
              Browse coffees and pastries from the bar. Tap a drink to customize milk, shots, or flavors.
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
            <Text fontSize="$5" fontWeight="700" color="$color">
              View cart · {totalQuantity} {totalQuantity === 1 ? "item" : "items"} · ${subtotal.toFixed(2)}
            </Text>
          </Button>
        )}
      </ScrollView>

      <Sheet
        open={customizationOpen && !!selectedItem}
        onOpenChange={handleCloseSheet}
        snapPoints={[85]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4" gap="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="700">
              {selectedItem?.name ?? "Customize drink"}
            </Text>
            <Text color="$color9">Dial in milk, espresso shots, and flavor pumps before adding to your cart.</Text>

            <Separator />

            <YStack gap="$2">
              <Text fontWeight="600">Milk option</Text>
              <XStack flexWrap="wrap" gap="$2">
                {milkOptions.map((option) => {
                  const isActive = customization.milkOption === option.value;
                  return (
                    <Button
                      key={option.value}
                      size="$2"
                      variant={isActive ? "solid" : "outlined"}
                      onPress={() => setCustomization((prev) => ({ ...prev, milkOption: option.value }))}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </XStack>
            </YStack>

            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="600">Espresso shots</Text>
                <Text color="$color9">Default is 2 shots</Text>
              </XStack>
              <XStack alignItems="center" gap="$3">
                <Button size="$2" circular variant="outlined" onPress={() => handleAdjustShots(-1)}>
                  -
                </Button>
                <Text fontSize="$6" fontWeight="700">
                  {customization.espressoShots}
                </Text>
                <Button size="$2" circular variant="outlined" onPress={() => handleAdjustShots(1)}>
                  +
                </Button>
              </XStack>
            </YStack>

            <Separator />

            <YStack gap="$2">
              <Text fontWeight="600">Flavor (optional)</Text>
              <Input
                placeholder="Flavor name, e.g. Vanilla"
                value={customization.flavorName}
                onChangeText={(text) =>
                  setCustomization((prev) => ({
                    ...prev,
                    flavorName: text,
                    flavorPumps: text ? prev.flavorPumps ?? 0 : 0,
                  }))
                }
              />
              <XStack alignItems="center" gap="$3">
                <Button
                  size="$2"
                  circular
                  variant="outlined"
                  onPress={() => handleAdjustFlavorPumps(-1)}
                  disabled={!customization.flavorName}
                >
                  -
                </Button>
                <YStack alignItems="center">
                  <Text fontSize="$6" fontWeight="700">
                    {customization.flavorPumps}
                  </Text>
                  <Text color="$color9" fontSize="$2">
                    pumps
                  </Text>
                </YStack>
                <Button
                  size="$2"
                  circular
                  variant="outlined"
                  onPress={() => handleAdjustFlavorPumps(1)}
                  disabled={!customization.flavorName}
                >
                  +
                </Button>
              </XStack>
            </YStack>

            <Separator />

            <YStack gap="$2">
              <Text fontWeight="600">Quantity</Text>
              <XStack alignItems="center" gap="$3">
                <Button size="$2" circular variant="outlined" onPress={() => handleAdjustQuantity(-1)}>
                  -
                </Button>
                <Text fontSize="$6" fontWeight="700">
                  {quantity}
                </Text>
                <Button size="$2" circular variant="outlined" onPress={() => handleAdjustQuantity(1)}>
                  +
                </Button>
              </XStack>
            </YStack>

            <Button theme="active" size="$4" onPress={handleSubmit} disabled={isSubmitting || !selectedItem}>
              {isSubmitting ? "Adding..." : "Add to cart"}
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

export default Menu;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
