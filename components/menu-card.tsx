import { MenuItem } from "@/types/menu";
import { getMenuImageSource } from "@/assets/menu";
import { Button, Card, Image, ScrollView, Text, XStack, YStack } from "tamagui";

type MenuCardProps = {
  item: MenuItem;
  quantity?: number;
  onPress: () => void;
  isCustomizable?: boolean;
};

const MenuCard = ({ item, quantity = 0, onPress, isCustomizable = true }: MenuCardProps) => {
  const isUnavailable = item.isAvailable === false;
  const hasQuantity = quantity > 0;
  const helperText = isCustomizable
    ? hasQuantity
      ? `In cart: ${quantity}`
      : 'Customize and add to cart'
    : hasQuantity
      ? `In cart: ${quantity}`
      : 'Tap to add to cart';
  const buttonLabel = isCustomizable ? (isUnavailable ? 'Sold out' : 'Customize') : isUnavailable ? 'Sold out' : 'Add to cart';

  return (
    <Card
      animation="bouncy"
      elevate
      bordered
      width="100%"
      backgroundColor="$background"
      pressStyle={{ scale: 0.99 }}
      opacity={isUnavailable ? 0.6 : 1}
      onPress={isUnavailable ? undefined : onPress}
    >
      <XStack padding="$4" gap="$4">
        <Image source={getMenuImageSource(item.imageKey)} alt={item.name} width={96} height={96} borderRadius="$4" />

        <YStack flex={1} space="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$6" fontWeight="700">
              {item.name}
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$color">
              ${item.price.toFixed(2)}
            </Text>
          </XStack>

          <Text fontSize="$3" color="$color" opacity={0.75} numberOfLines={3}>
            {item.description}
          </Text>

          {item.tags?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" paddingVertical="$1">
                {item.tags.map((tag) => (
                  <Text
                    key={tag}
                    fontSize="$2"
                    color="$color"
                    opacity={0.85}
                    backgroundColor="$backgroundHover"
                    borderRadius="$3"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                  >
                    {tag}
                  </Text>
                ))}
              </XStack>
            </ScrollView>
          ) : null}

          <XStack alignItems="center" justifyContent="space-between" marginTop="auto" gap="$2">
            <Text fontSize="$3" color="$color9" flexShrink={1}>
              {helperText}
            </Text>
            <Button
              size="$3"
              onPress={onPress}
              disabled={isUnavailable}
              opacity={isUnavailable ? 0.7 : 1}
              variant="outlined"
              flexShrink={0}
            >
              {buttonLabel}
            </Button>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
};

export default MenuCard;
