import React from 'react';
import { Card, Separator, Text, XStack, YStack } from 'tamagui';
import { RewardSummary } from '@/api/client';

type Props = {
  summary: RewardSummary;
};

export const RewardProgressCard = ({ summary }: Props) => {
  const punches = summary.punchCard.pointsTowardsNextFreeDrink;
  const threshold = summary.punchCard.freeDrinkThreshold;
  const freeCoffees = summary.punchCard.freeCoffeesAvailable;
  const progressPercent = Math.min(Math.max(summary.tier.percentToNext, 0), 100);
  const nextTierLabel =
    freeCoffees > 0
      ? `Free coffee ready (${freeCoffees}x)`
      : `${summary.tier.pointsUntilNext} punch${summary.tier.pointsUntilNext === 1 ? '' : 'es'} to go`;

  return (
    <Card bordered elevate padding="$4" backgroundColor="$backgroundStrong">
      <YStack space="$3">
        <YStack>
          <Text fontSize="$2" color="$color8">
            Free coffees ready
          </Text>
          <XStack alignItems="baseline" justifyContent="space-between">
            <Text fontSize="$8" fontWeight="700">
              {freeCoffees}
            </Text>
            <Text color="$color9">{punches}/{threshold} punches toward the next one</Text>
          </XStack>
        </YStack>

        <Separator />

        <YStack>
          <Text fontSize="$3" fontWeight="600">
            {summary.tier.current.name}
          </Text>
          <Text color="$color9">{summary.tier.current.tagline}</Text>
        </YStack>

        <YStack space="$2">
          <YStack height={10} borderRadius="$10" backgroundColor="$color4" overflow="hidden">
            <YStack height="100%" width={`${progressPercent}%`} backgroundColor="$green10" borderRadius="$10" />
          </YStack>
          <XStack justifyContent="space-between" alignItems="center">
            <Text color="$color9">Next up</Text>
            <Text fontWeight="600">{nextTierLabel}</Text>
          </XStack>
        </YStack>

        <Separator />

        <YStack>
          <Text fontSize="$3" fontWeight="600">
            Lifetime punches
          </Text>
          <Text color="$color9">{summary.lifetimeRewardPoints} total drinks + pastries</Text>
        </YStack>
      </YStack>
    </Card>
  );
};
