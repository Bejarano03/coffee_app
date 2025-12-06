export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
  guardrail?: string;
}

export interface AssistantHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface AssistantWeatherPayload {
  description: string;
  temperature: number;
  feelsLike: number;
  units: 'metric' | 'imperial';
  locationName?: string;
}

export interface AssistantResponsePayload {
  reply: string;
  guardrail?: 'transaction' | 'freebie' | 'support' | 'config' | 'error';
  suggestions: string[];
}
