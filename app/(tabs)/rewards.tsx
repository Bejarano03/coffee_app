import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import {
  AlertDialog,
  Button,
  Input,
  ScrollView,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui';

import { RewardSummary, RewardsAPI } from '@/api/client';
import { GiftCardBalanceCard } from '@/components/rewards/GiftCardBalanceCard';
import { RewardProgressCard } from '@/components/rewards/RewardProgressCard';
import { TransactionsList } from '@/components/rewards/TransactionsList';

const quickAmounts = [15, 25, 50, 100];

const Rewards = () => {
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refillAmount, setRefillAmount] = useState('25');
  const [isRefilling, setIsRefilling] = useState(false);
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });

  const showFeedback = useCallback((title: string, message: string) => {
    setFeedback({ open: true, title, message });
  }, []);

  const fetchSummary = useCallback(
    async (opts: { showSpinner?: boolean } = {}) => {
      const { showSpinner = false } = opts;
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await RewardsAPI.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to load rewards summary', error);
        showFeedback('Error', 'Unable to load rewards right now. Please pull to refresh.');
      } finally {
        if (showSpinner) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [showFeedback],
  );

  useEffect(() => {
    fetchSummary({ showSpinner: true }).catch((error) =>
      console.error('Failed to fetch rewards on mount', error),
    );
  }, [fetchSummary]);

  const handleReload = useCallback(async () => {
    const parsedAmount = Number(refillAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showFeedback('Invalid amount', 'Enter a valid dollar amount to continue.');
      return;
    }

    setIsRefilling(true);
    try {
      const data = await RewardsAPI.refillGiftCard(parsedAmount);
      setSummary(data);
      setShowRefillDialog(false);
      showFeedback('Balance updated', `Successfully reloaded $${parsedAmount.toFixed(2)} via mock Stripe checkout.`);
    } catch (error) {
      console.error('Failed to reload gift card', error);
      showFeedback('Reload failed', 'We were unable to mock the Stripe payment. Please try again.');
    } finally {
      setIsRefilling(false);
    }
  }, [refillAmount, showFeedback]);

  const quickActionButtons = useMemo(
    () =>
      quickAmounts.map((amount) => {
        const isActive = Number(refillAmount) === amount;
        return (
          <Button
            key={`quick-${amount}`}
            size="$2"
            variant={isActive ? 'solid' : 'outlined'}
            theme={isActive ? 'active' : undefined}
            onPress={() => setRefillAmount(amount.toString())}
          >
            <Text fontWeight="600">${amount}</Text>
          </Button>
        );
      }),
    [refillAmount],
  );

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$3">Loading rewards...</Text>
      </YStack>
    );
  }

  if (!summary) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background" padding="$4">
        <Text fontSize="$6" fontWeight="700">
          Rewards unavailable
        </Text>
        <Text textAlign="center" marginTop="$2" color="$color9">
          We were unable to fetch your points. Pull to refresh or try again later.
        </Text>
        <Button marginTop="$4" onPress={() => fetchSummary({ showSpinner: true })}>
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView
        flex={1}
        padding="$4"
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchSummary()} />}
      >
        <YStack space="$4">
          <RewardProgressCard summary={summary} />
          <GiftCardBalanceCard balance={summary.giftCardBalance} isProcessing={isRefilling} onPressReload={() => setShowRefillDialog(true)} />
          <TransactionsList
            rewardTransactions={summary.recentRewardTransactions}
            giftCardTransactions={summary.recentGiftCardTransactions}
          />
          <YStack space="$2" padding="$4" borderRadius="$6" backgroundColor="$backgroundStrong" borderWidth={1} borderColor="$borderColor">
            <Text fontWeight="700">How it works</Text>
            <Separator />
            <Text color="$color9">
              Every coffee or pastry purchase earns <Text fontWeight="700">1 punch</Text>; collect {summary.punchCard.freeDrinkThreshold} punches to unlock a free coffee.
              Gift card reloads add <Text fontWeight="700">2 pts</Text> per dollar as a bonus until the live Stripe flow is connected.
            </Text>
          </YStack>
        </YStack>
      </ScrollView>

      <AlertDialog open={showRefillDialog} onOpenChange={setShowRefillDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay key="refill-overlay" opacity={0.5} />
          <AlertDialog.Content key="refill-content">
            <YStack space="$3">
              <Text fontSize="$6" fontWeight="700">
                Refill gift card
              </Text>
              <Text color="$color9">Choose an amount to send through the mock Stripe checkout.</Text>
              <XStack gap="$2" flexWrap="wrap">
                {quickActionButtons}
              </XStack>
              <Input
                keyboardType="decimal-pad"
                placeholder="Custom amount"
                value={refillAmount}
                onChangeText={setRefillAmount}
              />
              <Separator />
              <XStack gap="$2" justifyContent="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined" disabled={isRefilling}>
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <Button
                  theme="active"
                  onPress={handleReload}
                  disabled={isRefilling}
                  loading={isRefilling}
                >
                  Pay with Stripe (mock)
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      <AlertDialog open={feedback.open} onOpenChange={(open) => setFeedback((current) => ({ ...current, open }))}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay key="feedback-overlay" opacity={0.4} />
          <AlertDialog.Content key="feedback-content">
            <Text fontSize="$6" fontWeight="700">
              {feedback.title}
            </Text>
            <Text marginTop="$2">{feedback.message}</Text>
            <XStack gap="$2" justifyContent="flex-end" marginTop="$4">
              <AlertDialog.Cancel asChild>
                <Button>Close</Button>
              </AlertDialog.Cancel>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  );
};

export default Rewards;
