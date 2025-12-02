import { useCart } from "@/context/CartContext";
import { router } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { Button, Image, ScrollView, Separator, Text, XStack, YStack } from "tamagui";

const Cart = () => {
  const { items, subtotal, addItem, decrementItem, removeItem, clearCart } = useCart();
  const hasItems = items.length > 0;

  return (
    <ScrollView flex={1} padding="$4" contentContainerStyle={styles.container}>
      {hasItems ? (
        <YStack space="$4">
          {items.map(({ item, quantity }) => (
            <YStack key={item.id} space="$3" borderWidth={1} borderColor="$borderColor" borderRadius="$5" padding="$3">
              <XStack gap="$3">
                <Image source={{ uri: item.image }} alt={item.name} width={72} height={72} borderRadius="$3" />
                <YStack flex={1} space="$1">
                  <Text fontSize="$5" fontWeight="700">
                    {item.name}
                  </Text>
                  <Text fontSize="$3" color="$color" opacity={0.75}>
                    {item.description}
                  </Text>
                  <Text fontWeight="700">${(item.price * quantity).toFixed(2)}</Text>
                </YStack>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap="$2">
                  <Button size="$2" circular onPress={() => decrementItem(item.id)}>
                    -
                  </Button>
                  <Text fontSize="$5" fontWeight="700">
                    {quantity}
                  </Text>
                  <Button size="$2" circular onPress={() => addItem(item)}>
                    +
                  </Button>
                </XStack>

                <Button size="$2" variant="outlined" onPress={() => removeItem(item.id)}>
                  Remove
                </Button>
              </XStack>
            </YStack>
          ))}

          <Separator />

          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700">
              Subtotal
            </Text>
            <Text fontSize="$5" fontWeight="700">
              ${subtotal.toFixed(2)}
            </Text>
          </XStack>

          <Button size="$4" onPress={clearCart}>
            Checkout (mock)
          </Button>
        </YStack>
      ) : (
        <YStack flex={1} alignItems="center" justifyContent="center" space="$3">
          <Text fontSize="$7" fontWeight="700">
            Your cart is empty
          </Text>
          <Text fontSize="$4" color="$color" opacity={0.75} textAlign="center">
            Add items from the menu tab to build your order.
          </Text>
          <Button onPress={() => router.push("/(tabs)/menu")}>Browse menu</Button>
        </YStack>
      )}
    </ScrollView>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
