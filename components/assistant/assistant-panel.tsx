import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Input, ScrollView, Text, XStack, YStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { AssistantAPI } from '@/api/client';
import { useWeather } from '@/hooks/use-weather';
import type { AssistantHistoryMessage, AssistantWeatherPayload, ChatMessage } from '@/types/assistant';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AssistantPanelProps {
  onClose: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'Recommend a drink for this weather',
  'What pastry pairs with a latte?',
  'Remind me how rewards work',
];

const HISTORY_LIMIT = 8;

const GUARDRAIL_COPY: Record<string, string> = {
  freebie: 'Policy reminder: no freebies or discounts can be issued here.',
  transaction: 'Security reminder: payments stay in the payments tab.',
  support: 'Need more help? Email support so a human can assist.',
  config: 'Assistant is warming up. Try again soon.',
  error: 'Something went sideways. Please try again.',
};

const createMessageId = () => Math.random().toString(36).slice(2, 10);

const buildHistoryPayload = (source: ChatMessage[]): AssistantHistoryMessage[] =>
  source
    .filter((msg) => !msg.pending)
    .map(({ role, content }) => ({ role, content }))
    .slice(-HISTORY_LIMIT);

const buildWeatherPayload = (weather: ReturnType<typeof useWeather>['weather']): AssistantWeatherPayload | undefined => {
  if (!weather) return undefined;

  return {
    description: weather.description,
    temperature: weather.temperature,
    feelsLike: weather.feelsLike,
    units: weather.units,
    locationName: weather.locationName,
  };
};

export const AssistantPanel = ({ onClose }: AssistantPanelProps) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#F7FAFF' : '#101828';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content:
        "I'm the Coffee Companion. Ask me about drinks, rewards, or anything coffee — I just can't handle payments.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const { weather } = useWeather();

  useEffect(() => {
    messagesRef.current = messages;
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const weatherPayload = useMemo(() => buildWeatherPayload(weather), [weather]);

  const pushAssistantResponse = useCallback((messageId: string, content: string, guardrail?: string) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === messageId ? { ...message, content, pending: false, guardrail } : message)),
    );
  }, []);

  const handleSend = useCallback(
    async (preset?: string) => {
      const text = (preset ?? input).trim();
      if (!text || isSending) {
        return;
      }

      setInput('');

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: text,
      };
      const pendingMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: 'Thinking…',
        pending: true,
      };

      const history = buildHistoryPayload([...messagesRef.current, userMessage]);
      setMessages((prev) => [...prev, userMessage, pendingMessage]);
      setIsSending(true);

      try {
        const response = await AssistantAPI.sendMessage({
          message: text,
          history,
          weather: weatherPayload,
        });

        const guardrail = response.guardrail ? GUARDRAIL_COPY[response.guardrail] : undefined;
        pushAssistantResponse(pendingMessage.id, response.reply.trim(), guardrail);

        if (response.suggestions?.length) {
          setSuggestions(response.suggestions);
        }
      } catch (error) {
        console.error('Assistant request failed', error);
        pushAssistantResponse(pendingMessage.id, 'I lost the connection for a moment. Please try sending that again.');
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, pushAssistantResponse, weatherPayload],
  );

  const handleSuggestionPress = useCallback(
    (text: string) => {
      void handleSend(text);
    },
    [handleSend],
  );

  const listHeader = useMemo(
    () => (
      <Card padding="$4" backgroundColor="$backgroundStrong" bordered>
        <Text color="$color" opacity={0.85}>
          Chat with our MCP agent for FAQs, drink ideas, and weather-aware recommendations. Payments and discounts stay
          in the main app for safety.
        </Text>
      </Card>
    ),
    [],
  );

  const listFooter = useMemo(
    () =>
      suggestions.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2, paddingTop: 8 }}
        >
          <XStack gap="$2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                size="$2"
                variant="outlined"
                onPress={() => handleSuggestionPress(suggestion)}
                disabled={isSending}
              >
                {suggestion}
              </Button>
            ))}
          </XStack>
        </ScrollView>
      ) : (
        <View style={{ height: 8 }} />
      ),
    [handleSuggestionPress, isSending, suggestions],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 24 : 0}
    >
      <YStack
        flex={1}
        width="100%"
        height="100%"
        padding="$4"
        paddingBottom={Math.max(insets.bottom, 16)}
        space="$3"
        backgroundColor="$background"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize={18} fontWeight="700">
            Coffee Companion
          </Text>
          <Button size="$2" circular variant="outlined" onPress={onClose} accessibilityLabel="Close assistant">
            <Ionicons name="close" size={18} color={iconColor} />
          </Button>
        </XStack>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <YStack marginBottom={12}>
              <Card
                padding="$3"
                backgroundColor={item.role === 'user' ? '$blue10' : '$backgroundStrong'}
                borderRadius="$6"
                borderWidth={1}
                borderColor={item.role === 'user' ? '$blue10' : '$borderColor'}
                opacity={item.pending ? 0.6 : 1}
              >
                <Text color={item.role === 'user' ? '#fff' : '$color'}>{item.content}</Text>
                {item.guardrail ? (
                  <Text color="$color" fontSize={12} marginTop={4} opacity={0.7}>
                    {item.guardrail}
                  </Text>
                ) : null}
                {item.pending ? (
                  <Text color={item.role === 'user' ? '#fff' : '$color'} fontSize={12} marginTop={4} opacity={0.8}>
                    Thinking…
                  </Text>
                ) : null}
              </Card>
            </YStack>
          )}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{ paddingVertical: 12 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <XStack gap="$2" alignItems="center">
          <Input
            flex={1}
            placeholder="Ask about coffee, rewards, or the weather"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => {
              void handleSend();
            }}
            returnKeyType="send"
          />
          <Button
            onPress={() => {
              void handleSend();
            }}
            disabled={isSending || !input.trim()}
            width={100}
          >
            {isSending ? <ActivityIndicator color="#fff" /> : 'Send'}
          </Button>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
};
