'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Plus, Trash2 } from 'lucide-react';
import { useChat } from '@/lib/client/hooks/useChat';
import { Message } from '@/lib/types/chat';
import { excludedPaths, widgetVariants } from './utils';
import { useChatHandlers } from './hooks/useChatHandlers';
import { useChatStorage, HistoryEntry } from './hooks/useChatStorage';
import { WelcomeScreen } from './parts/WelcomeScreen';
import { ChatMessages } from './parts/ChatMessages';
import { ChatInput } from './parts/ChatInput';
import { ChatHistory } from './parts/ChatHistory';

const ChatWidget = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const storage = useChatStorage();
  const { mutate: sendMessage, isPending, error } = useChat();

  const { handleSuggestionClick, handleSendMessage, handleKeyPress } =
    useChatHandlers({
      messages,
      setMessages,
      setInputValue,
      sendMessage,
      isPending,
      sessionId,
    });

  // On mount: restore last session from localStorage
  useEffect(() => {
    const stored = storage.loadCurrentSession();
    if (stored && stored.messages.length > 0) {
      setSessionId(stored.sessionId);
      setMessages(stored.messages);
    } else {
      setSessionId(crypto.randomUUID());
    }
    setHistory(storage.loadHistory());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist current session + keep history entry in sync on every message
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    storage.saveCurrentSession(sessionId, messages);
    storage.archiveToHistory(sessionId, messages);
    setHistory(storage.loadHistory());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sessionId]);

  // Auto-open widget on first visit, show button only on return visits
  useEffect(() => {
    if (sessionStorage.getItem('chatAutoOpened')) {
      setIsVisible(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsVisible(true);
      setShowTeaser(true);
      sessionStorage.setItem('chatAutoOpened', 'true');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setIsWidgetOpen(false);
      }
    };
    if (isWidgetOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWidgetOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPending]);

  // Scroll to bottom after history→chat animation completes (AnimatePresence mode="wait")
  useEffect(() => {
    if (!showHistory && messages.length > 0) {
      const t = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 250);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const handleNewChat = () => {
    if (messages.length > 0) {
      storage.archiveToHistory(sessionId, messages);
    }
    const newId = crypto.randomUUID();
    setSessionId(newId);
    setMessages([]);
    storage.clearCurrentSession();
    setHistory(storage.loadHistory());
    setShowHistory(false);
    setInputValue('');
  };

  const handleSelectSession = (sid: string, msgs: Message[]) => {
    // Archive current session before switching
    if (messages.length > 0 && sid !== sessionId) {
      storage.archiveToHistory(sessionId, messages);
    }
    setSessionId(sid);
    setMessages(msgs);
    storage.saveCurrentSession(sid, msgs);
    setHistory(storage.loadHistory());
    setShowHistory(false);
  };

  const handleDeleteEntry = (sid: string) => {
    storage.removeHistoryEntry(sid);
    setHistory(storage.loadHistory());
  };

  const handleClearHistory = () => {
    storage.clearAllHistory();
    setHistory([]);
  };

  if (excludedPaths.some((p) => pathname.startsWith(p))) return null;
  if (!isVisible) return null;

  return (
    <div ref={widgetRef}>
      {/* Teaser bubble */}
      <AnimatePresence>
        {showTeaser && !isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed md:bottom-19 md:right-14 right-14 bottom-17 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 px-4 py-3 w-64 cursor-pointer"
            onClick={() => { setShowTeaser(false); setIsWidgetOpen(true); }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">RuteBot</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">Hi! Need help? Ask me anything about our services or bookings.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isWidgetOpen && (
        <motion.button
          onClick={() => { setShowTeaser(false); setIsWidgetOpen(true); }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 border-2 border-white/20 z-50 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )}

      {/* Chat Popup */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{
                width: 'min(400px, calc(100vw - 32px))',
                height: '600px',
              }}
            >
              {/* Brand label — only in chat view */}
              {!showHistory && (
                <div className="absolute top-3.5 left-4 z-10 flex items-center gap-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-green-600 block" />
                  <span className="text-sm font-semibold text-gray-900 tracking-wide">RuteBot</span>
                </div>
              )}

              {/* Top-right controls: New Chat + History + (Trash when history open) + Close */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                {!showHistory && (
                  <button
                    onClick={handleNewChat}
                    title="New chat"
                    className="cursor-pointer text-gray-500 hover:text-gray-900 transition-colors duration-200 bg-gray-100 rounded-full p-1"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                )}
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  title="Chat history"
                  className="cursor-pointer text-gray-500 hover:text-gray-900 transition-colors duration-200 bg-gray-100 rounded-full p-1"
                >
                  <History className="w-4.5 h-4.5" />
                </button>
                {showHistory && history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    title="Clear all history"
                    className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors duration-200 bg-gray-100 rounded-full p-1"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsWidgetOpen(false)}
                  className="cursor-pointer text-gray-500 hover:text-gray-900 transition-colors duration-200 bg-gray-100 rounded-full p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              {/* Inner content — chat OR history */}
              <AnimatePresence mode="wait">
                {showHistory ? (
                  <ChatHistory
                    key="history"
                    history={history}
                    onSelectSession={handleSelectSession}
                    onDeleteEntry={handleDeleteEntry}
                    onNewChat={handleNewChat}
                    onBack={() => setShowHistory(false)}
                  />
                ) : (
                  <motion.div
                    key="chat"
                    variants={widgetVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="bg-white text-gray-900 flex flex-col w-full h-full"
                  >
                    <div className="mb-12" />

                    {messages.length === 0 ? (
                      <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                    ) : (
                      <ChatMessages
                        messages={messages}
                        isPending={isPending}
                        error={error}
                        messagesEndRef={messagesEndRef}
                        onActionMessage={(text) => handleSendMessage(text)}
                      />
                    )}

                    <ChatInput
                      inputValue={inputValue}
                      onInputChange={setInputValue}
                      onSend={() => handleSendMessage(inputValue)}
                      onKeyPress={(e) => handleKeyPress(e, inputValue)}
                      isPending={isPending}
                      hasMessages={messages.length > 0}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
