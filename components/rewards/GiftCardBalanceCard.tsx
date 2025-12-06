import React from 'react';
import { Button, Card, Text, XStack, YStack } from 'tamagui';
import { getPrimaryButtonStyles, useBrandColors } from '@/hooks/use-brand-colors';

type Props = {
  balance: number;
  isProcessing?: boolean;
  onPressReload?: () => void;
};

export const GiftCardBalanceCard = ({ balance, isProcessing, onPressReload }: Props) => {
  const brand = useBrandColors();
  const primaryButtonStyles = getPrimaryButtonStyles(brand);

  return (
    <Card bordered elevate padding="$4" backgroundColor="$backgroundStrong">
      <YStack space="$3">
        <Text fontSize="$3" color="$color9">
          Gift card balance
        </Text>
        <Text fontSize="$8" fontWeight="700">
          ${balance.toFixed(2)}
        </Text>
        <XStack justifyContent="space-between" alignItems="center" columnGap="$3" rowGap="$3" flexWrap="wrap">
          <YStack flex={1} minWidth={160}>
            <Text fontSize="$2" color="$color9">
              Reload keeps your caffeine funds ready (max $100 per load).
            </Text>
          </YStack>
          <Button
            size="$3"
            onPress={onPressReload}
            disabled={isProcessing}
            loading={isProcessing}
            alignSelf="flex-start"
            {...primaryButtonStyles}
          >
            Refill
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
};
