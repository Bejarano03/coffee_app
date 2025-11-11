import React from "react";
import { StyleSheet } from "react-native";
import { Card, Image, SizeTokens, Text, XStack, YStack } from "tamagui";

// Definitions expected by the component
interface PromotionCardProps {
  title: string;
  description: string;
  imageSource: { uri: string } | number;
}

// Fixed size for the image in the card
const IMAGE_SIZE: SizeTokens = "$10"; // About 120px

export default function PromotionCard({
  title,
  description,
  imageSource,
}: PromotionCardProps) {
  return (
    <Card
      animation="bouncy"
      size="$6"
      width="100%"
      marginBottom="$3"
      backgroundColor="$backgroundLighter"
      elevation="$3"
      pressStyle={{ scale: 0.98 }} // Fun press effect
    >
      <XStack padding="$5" alignItems="center" gap="$5">
        {/* Left side: Text title */}
        <YStack flex={1} space="$2">
          <Text fontSize="$7" fontWeight="700" color="$color">{title}</Text>
          <Text fontSize="$3" color="$color$8" numberOfLines={3}>{description}</Text>
        </YStack>

        {/* Right size: image */} 
        <Image 
          source={imageSource}
          alt={title}
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          borderRadius="$4"
        />
      </XStack>
    </Card>
  );
}

const styles = StyleSheet.create({});
