import { getMenuImageSource } from "@/assets/menu";
import { PaymentsAPI, RewardSummary, RewardsAPI } from "@/api/client";
import { useCart } from "@/context/CartContext";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AlertDialog, Button, Image, Input, ScrollView, Separator, Text, XStack, YStack } from "tamagui";

const milkLabels: Record<string, string> = {
  WHOLE: "Whole milk",
  HALF_AND_HALF: "Half & half",
  ALMOND: "Almond milk",
  OAT: "Oat milk",
  SOY: "Soy milk",
};

const reloadQuickAmounts = Array.from({ length: 9 }, (_, idx) => 10 + idx * 5);

const Cart = () => {
  const { items, subtotal, addItem, decrementItem, removeItem, clearCart, isSyncing, refreshCart, toggleFreeDrink } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [rewardsSummary, setRewardsSummary] = useState<RewardSummary | null>(null);
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [isPayingWithGiftCard, setIsPayingWithGiftCard] = useState(false);
  const [showReloadDialog, setShowReloadDialog] = useState(false);
  const [reloadAmount, setReloadAmount] = useState("10");
  const [isReloadingBalance, setIsReloadingBalance] = useState(false);
  const [isRedeemingFreeDrink, setIsRedeemingFreeDrink] = useState(false);
  const hasItems = items.length > 0;
  const giftCardBalance = rewardsSummary?.giftCardBalance ?? null;
  const availableFreeDrinks = rewardsSummary?.freeCoffeeCredits ?? 0;
  const pendingFreeDrinks = useMemo(
    () => items.reduce((total, line) => (line.isFreeDrink ? total + line.quantity : total), 0),
    [items]
  );
  const displayedFreeDrinks = Math.max(availableFreeDrinks - pendingFreeDrinks, 0);
  const redeemableCartItems = useMemo(
    () => items.filter((line) => line.item.category === "COFFEE" && !line.isFreeDrink && line.quantity === 1),
    [items]
  );
  const formattedGiftCardBalance = useMemo(
    () => (giftCardBalance !== null ? `$${giftCardBalance.toFixed(2)}` : isRewardsLoading ? "Loading..." : "—"),
    [giftCardBalance, isRewardsLoading]
  );
  const deficit = useMemo(() => Math.max(0, subtotal - (giftCardBalance ?? 0)), [subtotal, giftCardBalance]);
  useEffect(() => {
    if (isRedeemingFreeDrink && (displayedFreeDrinks <= 0 || redeemableCartItems.length === 0)) {
      setIsRedeemingFreeDrink(false);
    }
  }, [displayedFreeDrinks, redeemableCartItems.length, isRedeemingFreeDrink]);

  const loadRewardsSummary = useCallback(async () => {
    try {
      setIsRewardsLoading(true);
      const summary = await RewardsAPI.getSummary();
      setRewardsSummary(summary);
    } catch (error) {
      console.error("Failed to load rewards summary", error);
    } finally {
      setIsRewardsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRewardsSummary();
    }, [loadRewardsSummary])
  );

  const handleRefresh = useCallback(() => {
    refreshCart().catch((error) => console.error("Failed to refresh cart", error));
    void loadRewardsSummary();
  }, [refreshCart, loadRewardsSummary]);

  const handleCheckout = useCallback(async () => {
    if (!hasItems) {
      return;
    }

    setIsCheckingOut(true);
    try {
      if (subtotal <= 0) {
        await PaymentsAPI.completeFreeOrder();
        await clearCart();
        await loadRewardsSummary();
        Alert.alert("Order placed", "Enjoy your free coffee!");
        return;
      }

      const { clientSecret } = await PaymentsAPI.createPaymentIntent();

      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Coffee Club",
      });

      if (initResult.error) {
        Alert.alert("Checkout unavailable", initResult.error.message ?? "Unable to initialize payment sheet.");
        return;
      }

      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        if (paymentResult.error.code !== 'Canceled') {
          Alert.alert("Payment failed", paymentResult.error.message ?? "Please try again.");
        }
        return;
      }

      await clearCart();
      await loadRewardsSummary();
      Alert.alert("Order placed", "Thanks! Your payment was successful.");
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Something went wrong while starting checkout.';
      Alert.alert('Checkout failed', message);
    } finally {
      setIsCheckingOut(false);
    }
  }, [hasItems, subtotal, initPaymentSheet, presentPaymentSheet, clearCart, loadRewardsSummary]);

  const handlePayWithGiftCard = useCallback(async () => {
    if (!hasItems) {
      return;
    }

    const balance = giftCardBalance ?? 0;

    if (balance < subtotal) {
      const shortfall = Math.ceil((subtotal - balance) / 5) * 5;
      const suggested = Math.max(10, shortfall);
      setReloadAmount(suggested.toString());
      setShowReloadDialog(true);
      return;
    }

    setIsPayingWithGiftCard(true);
    try {
      await PaymentsAPI.payWithGiftCard();
      await refreshCart();
      await loadRewardsSummary();
      Alert.alert("Order placed", "Your gift card balance covered this order.");
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to use your gift card right now.';
      Alert.alert('Gift card payment failed', message);
    } finally {
      setIsPayingWithGiftCard(false);
    }
  }, [giftCardBalance, hasItems, subtotal, refreshCart, loadRewardsSummary]);

  const handleReloadGiftCard = useCallback(async () => {
    const parsedAmount = Number(reloadAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount % 5 !== 0) {
      Alert.alert('Invalid reload', 'Choose at least $10 in $5 increments.');
      return;
    }

    setIsReloadingBalance(true);
    try {
      const { clientSecret, paymentIntentId, amountCents } = await PaymentsAPI.createGiftCardReloadIntent(parsedAmount);

      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Coffee Club",
      });

      if (initResult.error) {
        Alert.alert("Stripe unavailable", initResult.error.message ?? "Unable to initialize payment sheet.");
        return;
      }

      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        if (paymentResult.error.code !== 'Canceled') {
          Alert.alert("Payment failed", paymentResult.error.message ?? "Please try again.");
        }
        return;
      }

      const normalizedAmount = amountCents / 100;
      await RewardsAPI.refillGiftCard(normalizedAmount, paymentIntentId);
      await loadRewardsSummary();
      setShowReloadDialog(false);
      Alert.alert("Gift card reloaded", `Added $${normalizedAmount.toFixed(2)} to your balance.`);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to reload your gift card.';
      Alert.alert('Reload failed', message);
    } finally {
      setIsReloadingBalance(false);
    }
  }, [reloadAmount, initPaymentSheet, presentPaymentSheet, loadRewardsSummary]);

  const handleStartRedeem = useCallback(() => {
    if (displayedFreeDrinks <= 0) {
      Alert.alert('No free drinks available', 'Earn more punches to unlock another free coffee.');
      return;
    }

    if (redeemableCartItems.length === 0) {
      Alert.alert('No eligible drinks', 'Add a single coffee drink to your cart before redeeming a free reward.');
      return;
    }

    setIsRedeemingFreeDrink(true);
  }, [displayedFreeDrinks, redeemableCartItems.length]);

  const handleApplyFreeDrink = useCallback(
    async (cartItemId: number) => {
      const target = items.find((line) => line.id === cartItemId);
      if (!target) {
        return;
      }

      if (target.quantity !== 1) {
        Alert.alert('Adjust quantity', 'Set the drink quantity to 1 before applying your free reward.');
        return;
      }

      try {
        await toggleFreeDrink(cartItemId, true);
        setIsRedeemingFreeDrink(false);
      } catch (error: any) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Unable to redeem your free drink right now.';
        Alert.alert('Redeem failed', message);
      }
    },
    [items, toggleFreeDrink]
  );

  const handleRemoveFreeDrink = useCallback(
    async (cartItemId: number) => {
      try {
        await toggleFreeDrink(cartItemId, false);
        setIsRedeemingFreeDrink(false);
      } catch (error: any) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Unable to remove the free drink from this item.';
        Alert.alert('Update failed', message);
      }
    },
    [toggleFreeDrink]
  );

  return (
    <>
      <ScrollView
        flex={1}
        padding="$4"
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />}
      >
        {hasItems ? (
          <YStack space="$4">
          {items.map(({ id: cartItemId, item, quantity, milkOption, espressoShots, flavorName, flavorPumps, isFreeDrink }) => {
            const isCoffee = item.category === "COFFEE";
            return (
              <YStack key={cartItemId} space="$3" borderWidth={1} borderColor="$borderColor" borderRadius="$5" padding="$3">
                <XStack gap="$3">
                  <Image source={getMenuImageSource(item.imageKey)} alt={item.name} width={72} height={72} borderRadius="$3" />
                  <YStack flex={1} space="$1">
                    <Text fontSize="$5" fontWeight="700">
                      {item.name}
                    </Text>
                    <Text fontSize="$3" color="$color" opacity={0.75}>
                      {item.description}
                    </Text>
                    {isCoffee && (
                      <>
                        <Text fontSize="$3" color="$color9">
                          {milkLabels[milkOption] ?? "House milk"} · {espressoShots} shot{espressoShots === 1 ? "" : "s"}
                        </Text>
                        {flavorName ? (
                          <Text fontSize="$3" color="$color9">
                            {flavorName} · {flavorPumps ?? 0} pump{(flavorPumps ?? 0) === 1 ? "" : "s"}
                          </Text>
                        ) : null}
                      </>
                    )}
                    <Text fontWeight="700">
                      {isFreeDrink ? 'Free' : `$${(item.price * quantity).toFixed(2)}`}
                    </Text>
                  </YStack>
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$2">
                    <Button size="$2" circular onPress={() => void decrementItem(cartItemId)}>
                      -
                    </Button>
                    <Text fontSize="$5" fontWeight="700">
                      {quantity}
                    </Text>
                    <Button
                      size="$2"
                      circular
                      onPress={() =>
                        void addItem(item, {
                          quantity: 1,
                          customizations: isCoffee
                            ? { milkOption, espressoShots, flavorName: flavorName ?? undefined, flavorPumps }
                            : undefined,
                        })
                      }
                    >
                      +
                    </Button>
                  </XStack>

                  <Button size="$2" variant="outlined" onPress={() => void removeItem(cartItemId)}>
                    Remove
                  </Button>
                </XStack>

                {isCoffee && (
                  <XStack gap="$2" flexWrap="wrap" alignItems="center">
                    {isFreeDrink ? (
                      <>
                        <Text fontSize="$3" fontWeight="700" color="$green10">
                          Free drink applied
                        </Text>
                        <Button size="$2" variant="outlined" onPress={() => void handleRemoveFreeDrink(cartItemId)}>
                          Remove free drink
                        </Button>
                      </>
                    ) : (
                      isRedeemingFreeDrink && (
                        <Button
                          size="$2"
                          variant="outlined"
                          onPress={() => void handleApplyFreeDrink(cartItemId)}
                        >
                          Apply free drink
                        </Button>
                      )
                    )}
                  </XStack>
                )}
              </YStack>
            );
          })}

          <Separator />

          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700">
              Subtotal
            </Text>
            <Text fontSize="$5" fontWeight="700">
              ${subtotal.toFixed(2)}
            </Text>
          </XStack>

          <YStack space="$3" padding="$3" borderRadius="$5" borderWidth={1} borderColor="$borderColor">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" fontWeight="700">
                Gift card balance
              </Text>
              <Text fontSize="$4" fontWeight="700">
                {formattedGiftCardBalance}
              </Text>
            </XStack>
            <XStack gap="$2">
              <Button
                flex={1}
                size="$3"
                variant="outlined"
                disabled={!hasItems || giftCardBalance === null || isPayingWithGiftCard}
                onPress={() => void handlePayWithGiftCard()}
              >
                {isPayingWithGiftCard ? 'Charging…' : 'Pay with gift card'}
              </Button>
              <Button size="$3" variant="outlined" onPress={() => setShowReloadDialog(true)}>
                Reload
              </Button>
            </XStack>
            {giftCardBalance !== null && subtotal > 0 && giftCardBalance < subtotal && (
              <Text fontSize="$3" color="$color9">
                Need ${(deficit).toFixed(2)} more to cover this order. Reloads start at $10 in $5 steps.
              </Text>
            )}
            <Separator />
            <YStack space="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text fontSize="$4" fontWeight="700">
                    Free drinks available
                  </Text>
                  <Text fontSize="$6" fontWeight="700">
                    {isRewardsLoading ? '—' : displayedFreeDrinks}
                  </Text>
                  {pendingFreeDrinks > 0 && (
                    <Text fontSize="$3" color="$color9">
                      {pendingFreeDrinks} free drink{pendingFreeDrinks === 1 ? '' : 's'} applied to this order.
                    </Text>
                  )}
                </YStack>
                <XStack gap="$2">
                  {isRedeemingFreeDrink && (
                    <Button variant="outlined" size="$3" onPress={() => setIsRedeemingFreeDrink(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="$3"
                    theme="active"
                    disabled={displayedFreeDrinks <= 0}
                    onPress={() => (isRedeemingFreeDrink ? setIsRedeemingFreeDrink(false) : handleStartRedeem())}
                  >
                    {isRedeemingFreeDrink ? 'Select a drink' : 'Redeem free drink'}
                  </Button>
                </XStack>
              </XStack>
              {isRedeemingFreeDrink && (
                <Text fontSize="$3" color="$color9">
                  Tap “Apply free drink” on the coffee you want to cover.
                </Text>
              )}
            </YStack>
          </YStack>

          <Button size="$4" onPress={() => void handleCheckout()} disabled={isCheckingOut || !hasItems}>
            {isCheckingOut ? 'Processing…' : subtotal <= 0 ? 'Place order (free)' : 'Pay with card'}
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

      <AlertDialog open={showReloadDialog} onOpenChange={setShowReloadDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay key="reload-overlay" opacity={0.5} />
          <AlertDialog.Content key="reload-content">
            <YStack space="$3">
              <Text fontSize="$6" fontWeight="700">
                Reload gift card
              </Text>
              <Text color="$color9">Add funds in $5 increments (minimum $10).</Text>
              <XStack gap="$2" flexWrap="wrap">
                {reloadQuickAmounts.map((amount) => {
                  const isActive = Number(reloadAmount) === amount;
                  return (
                    <Button
                      key={`reload-${amount}`}
                      size="$2"
                      variant={isActive ? "solid" : "outlined"}
                      theme={isActive ? "active" : undefined}
                      onPress={() => setReloadAmount(amount.toString())}
                    >
                      <Text fontWeight="600">${amount}</Text>
                    </Button>
                  );
                })}
              </XStack>
              <Input
                keyboardType="number-pad"
                placeholder="Custom amount"
                value={reloadAmount}
                onChangeText={setReloadAmount}
              />
              <Separator />
              <XStack gap="$2" justifyContent="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined" disabled={isReloadingBalance}>
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <Button
                  theme="active"
                  onPress={() => void handleReloadGiftCard()}
                  disabled={isReloadingBalance}
                  loading={isReloadingBalance}
                >
                  Reload with Stripe
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  );
};

export default Cart;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    flexGrow: 1,
  },
});
