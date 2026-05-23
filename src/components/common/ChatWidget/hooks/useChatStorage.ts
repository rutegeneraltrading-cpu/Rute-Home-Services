'use client';

import { Message } from '@/lib/types/chat';

const CURRENT_SESSION_KEY = 'chat_current_session';
const HISTORY_KEY = 'chat_sessions_history';
const MAX_HISTORY = 20;

export interface HistoryEntry {
  sessionId: string;
  preview: string;
  date: string;
  messages: Message[];
}

export interface StoredSession {
  sessionId: string;
  messages: Message[];
}

export const useChatStorage = () => {
  const loadCurrentSession = (): StoredSession | null => {
    try {
      const raw = localStorage.getItem(CURRENT_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  };

  const saveCurrentSession = (sessionId: string, messages: Message[]) => {
    try {
      localStorage.setItem(
        CURRENT_SESSION_KEY,
        JSON.stringify({ sessionId, messages })
      );
    } catch {}
  };

  const loadHistory = (): HistoryEntry[] => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HistoryEntry[];
      // Ensure every entry has a messages array (handles old format entries)
      return parsed.map((e) => ({ ...e, messages: e.messages ?? [] }));
    } catch {
      return [];
    }
  };

  const archiveToHistory = (sessionId: string, messages: Message[]) => {
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (!firstUserMsg) return;

    try {
      const history = loadHistory();
      const existingIndex = history.findIndex((h) => h.sessionId === sessionId);

      const entry: HistoryEntry = {
        sessionId,
        preview: firstUserMsg.content.slice(0, 60),
        date: existingIndex >= 0 ? history[existingIndex].date : new Date().toISOString(),
        messages,
      };

      let updated: HistoryEntry[];
      if (existingIndex >= 0) {
        // Update existing entry with latest messages
        updated = [...history];
        updated[existingIndex] = entry;
      } else {
        // New entry at the top
        updated = [entry, ...history].slice(0, MAX_HISTORY);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearCurrentSession = () => {
    try {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    } catch {}
  };

  const removeHistoryEntry = (sessionId: string) => {
    try {
      const history = loadHistory();
      const updated = history.filter((h) => h.sessionId !== sessionId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearAllHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  return {
    loadCurrentSession,
    saveCurrentSession,
    loadHistory,
    archiveToHistory,
    clearCurrentSession,
    removeHistoryEntry,
    clearAllHistory,
  };
};
