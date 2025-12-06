import React from "react";
import { Text, XStack, YStack } from "tamagui";
import { IconSymbol } from "./ui/icon-symbol";

interface HomeHeaderProps {
  iconColor: string;
  onProfilePress: () => void;
  userName?: string;
}

const HomeHeader = ({ iconColor, onProfilePress, userName }: HomeHeaderProps) => {
  const greetingName = userName?.trim() || "friend";

  return (
    <XStack flex={1} alignItems="center" justifyContent="space-between">
      <Text fontSize="$7" fontWeight="700">
        Nice to see you {greetingName}
      </Text>

      <YStack
        padding="$2"
        borderRadius="$10"
        hoverStyle={{ backgroundColor: "$backgroundHover" }}
        pressStyle={{ opacity: 0.7 }}
        onPress={onProfilePress}
      >
      <IconSymbol size={28} name="person.fill" color={iconColor} />
      </YStack>
    </XStack>
  );
};

export default HomeHeader;
