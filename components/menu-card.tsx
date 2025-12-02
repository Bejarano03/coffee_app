import { MenuItem } from "@/types/menu";
import { getMenuImageSource } from "@/assets/menu";
import { Button, Card, Image, Text, XStack, YStack } from "tamagui";

type MenuCardProps = {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

const MenuCard = ({ item, quantity, onAdd, onIncrement, onDecrement }: MenuCardProps) => {
  const isUnavailable = item.isAvailable === false;

  return (
    <Card
      animation="bouncy"
      elevate
      bordered
      width="100%"
      backgroundColor="$background"
      pressStyle={{ scale: 0.99 }}
      opacity={isUnavailable ? 0.6 : 1}
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
            <XStack flexWrap="wrap" gap="$2">
              {item.tags.map((tag) => (
                <Text
                  key={tag}
                  fontSize="$2"
                  color="$color"
                  opacity={0.8}
                  backgroundColor="$backgroundHover"
                  borderRadius="$3"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                >
                  {tag}
                </Text>
              ))}
            </XStack>
          ) : null}

          <XStack justifyContent="flex-end" alignItems="center" marginTop="auto">
            {quantity > 0 ? (
              <XStack alignItems="center" gap="$3">
                <Button size="$2" circular variant="outlined" onPress={onDecrement} disabled={isUnavailable}>
                  -
                </Button>
                <Text fontSize="$5" fontWeight="700">
                  {quantity}
                </Text>
                <Button size="$2" circular variant="outlined" onPress={onIncrement} disabled={isUnavailable}>
                  +
                </Button>
              </XStack>
            ) : (
              <Button size="$3" onPress={onAdd} disabled={isUnavailable} opacity={isUnavailable ? 0.7 : 1}>
                {isUnavailable ? "Sold out" : "Add to cart"}
              </Button>
            )}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
};

export default MenuCard;
