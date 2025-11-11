import React from "react";
import { StyleSheet } from "react-native";
import { Text, XStack } from "tamagui";
import { IconSymbol } from "./ui/icon-symbol";

const HomeHeader = () => {
  return (
    <XStack flex={1} alignItems="center" justifyContent="space-between">
      <Text fontSize="$7" fontWeight="700">
        Nice to see you {"user"}
      </Text>

      <IconSymbol size={28} name="person.fill" color="$color.inverse" />
    </XStack>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({});
