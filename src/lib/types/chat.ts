export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
}

export interface ChatRequest {
  messages: Message[];
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  role: 'assistant';
}

export interface ChatError {
  error: string;
}
