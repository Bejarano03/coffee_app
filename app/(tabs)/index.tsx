import PromotionCard from "@/components/promotion-card";
import React from "react";
import { StyleSheet } from "react-native";
import { ScrollView, YStack } from "tamagui";

const Index = () => {
  const promotions = [
    {
      id: 'pumpkin-spice',
      title: "Spiced Pumpkin Latte",
      description: "Our signature seasonal favorite is back with pumpkin spice, whipped cream, and a drizzle of caramel.",
      imageSource: require('@/assets/images/Pumpkin-Spice-Latte.png'),
    },
    {
      id: 'winter-mocha',
      title: "Winter Peppermint Mocha",
      description: "Dark chocolate, cool peppermint, and bold espresso crafted for cozy afternoons.",
      imageSource: require('@/assets/images/winter-peppermint-mocha.png'),
    },
    {
      id: 'maple-cold-foam',
      title: "Maple Cold Foam Cold Brew",
      description: "Slow-steeped cold brew crowned with house-made maple cold foam.",
      imageSource: require('@/assets/images/maple-cold-foam.png'),
    },
    {
      id: 'gift-card-bonus',
      title: "Holiday Gift Card Bonus",
      description: "Buy a $50 gift card and receive a free $5 credit for your next purchase.",
      imageSource: require('@/assets/images/gift-card.png'),
    },
  ];

  return (
    <ScrollView flex={1} paddingHorizontal="$4" paddingVertical="$3">
      {/* map over the cards*/}
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
