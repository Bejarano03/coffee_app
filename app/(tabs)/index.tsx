import PromotionCard from "@/components/promotion-card";
import React from "react";
import { StyleSheet } from "react-native";
import { ScrollView, YStack } from "tamagui";

const Index = () => {
  const promotions = [
    {
      id: 1,
      title: "Spiced Pumpkin Latter",
      description: "Our signature seasonal favorite is back! A rich blend of espresso, steamed milk, and classic pumpkin spice, topped with whipped cream.",
      imageSource: { uri: 'https://picsum.photos/120/120?image=10'}
    },
    {
      id: 2,
      title: "Winter Peppermint Mocha",
      description: "A decadent mix of dark chocolate, cool peppermint, and bold espresso to warm your spirits.",
      imageSource: { uri: 'https://picsum.photos/120/120?image=11'}
    },
    {
      id: 3,
      title: "Holiday Gift Card Bonus",
      description: "Buy a \$50 gift card and receive a free \$5 credit for your next purchase. Perfect stocking stuffers!",
      imageSource: { uri: 'https://picsum.photos/120/120?image=12' },
    },
    {
      id: 4,
      title: "Spiced Pumpkin Latter",
      description: "Our signature seasonal favorite is back! A rich blend of espresso, steamed milk, and classic pumpkin spice, topped with whipped cream.",
      imageSource: { uri: 'https://picsum.photos/120/120?image=10'}
    },
    {
      id: 5,
      title: "Winter Peppermint Mocha",
      description: "A decadent mix of dark chocolate, cool peppermint, and bold espresso to warm your spirits.",
      imageSource: { uri: 'https://picsum.photos/120/120?image=11'}
    },
    {
      id: 6,
      title: "Holiday Gift Card Bonus",
      description: "Buy a \$50 gift card and receive a free \$5 credit for your next purchase. Perfect stocking stuffers!",
      imageSource: { uri: 'https://picsum.photos/120/120?image=12' },
    }
  ];

  return (
    <ScrollView flex={1} paddingHorizontal="$4" paddingVertical="$3">
      // Map over the data above for now
      <YStack space="$3">
        {promotions.map((promo) => (
          <PromotionCard 
            key={promo.id}
            title={promo.title}
            description={promo.description}
            imageSource={promo.imageSource}
          />
        ))}
      </YStack>
    </ScrollView>
  );
};

export default Index;

const styles = StyleSheet.create({});
