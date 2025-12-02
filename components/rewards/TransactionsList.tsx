import React from 'react';
import { Card, Separator, Text, XStack, YStack } from 'tamagui';
import { GiftCardTransactionDto, RewardTransactionDto } from '@/api/client';

type Props = {
  rewardTransactions: RewardTransactionDto[];
  giftCardTransactions: GiftCardTransactionDto[];
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatRewardSubtitle = (tx: RewardTransactionDto) => {
  if (tx.type === 'EARN') {
    return `+${tx.points} pts · ${tx.reason}`;
  }
  if (tx.type === 'REDEEM') {
    return `-${tx.points} pts · Redeemed`;
  }
  return `${tx.points} pts · Adjustment`;
};

const formatGiftCardSubtitle = (tx: GiftCardTransactionDto) => {
  const amount = `${tx.type === 'PURCHASE' ? '-' : '+'}$${tx.amount.toFixed(2)}`;
  return tx.note ? `${amount} · ${tx.note}` : amount;
};

export const TransactionsList = ({ rewardTransactions, giftCardTransactions }: Props) => {
  const hasHistory = rewardTransactions.length > 0 || giftCardTransactions.length > 0;

  return (
    <Card bordered elevate padding="$4" backgroundColor="$backgroundStrong">
      <YStack space="$3">
        <Text fontSize="$5" fontWeight="700">
          Activity
        </Text>
        {!hasHistory ? (
          <Text color="$color9">No transactions yet. Reload a card or earn points to see history.</Text>
        ) : (
          <YStack space="$4">
            {rewardTransactions.length > 0 && (
              <YStack space="$2">
                <Text fontSize="$3" fontWeight="600">
                  Rewards
                </Text>
                {rewardTransactions.map((tx) => (
                  <YStack key={`reward-${tx.id}`} paddingVertical="$2">
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600">{formatDate(tx.createdAt)}</Text>
                      <Text color={tx.type === 'EARN' ? '$green10' : '$red10'} fontWeight="700">
                        {tx.type === 'EARN' ? '+' : '-'}
                        {tx.points} pts
                      </Text>
                    </XStack>
                    <Text color="$color9">{formatRewardSubtitle(tx)}</Text>
                  </YStack>
                ))}
              </YStack>
            )}

            {rewardTransactions.length > 0 && giftCardTransactions.length > 0 && <Separator />}

            {giftCardTransactions.length > 0 && (
              <YStack space="$2">
                <Text fontSize="$3" fontWeight="600">
                  Gift card
                </Text>
                {giftCardTransactions.map((tx) => (
                  <YStack key={`gift-${tx.id}`} paddingVertical="$2">
                    <XStack justifyContent="space-between">
                      <Text fontWeight="600">{formatDate(tx.createdAt)}</Text>
                      <Text color={tx.type === 'PURCHASE' ? '$red10' : '$blue10'} fontWeight="700">
                        {tx.type === 'PURCHASE' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </Text>
                    </XStack>
                    <Text color="$color9">{formatGiftCardSubtitle(tx)}</Text>
                  </YStack>
                ))}
              </YStack>
            )}
          </YStack>
        )}
      </YStack>
    </Card>
  );
};
