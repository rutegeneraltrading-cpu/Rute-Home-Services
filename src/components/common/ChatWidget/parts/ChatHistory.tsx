import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Plus, X } from 'lucide-react';
import { Message } from '@/lib/types/chat';
import { HistoryEntry } from '../hooks/useChatStorage';

interface ChatHistoryProps {
  history: HistoryEntry[];
  onSelectSession: (sessionId: string, messages: Message[]) => void;
  onDeleteEntry: (sessionId: string) => void;
  onNewChat: () => void;
  onBack: () => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
};

export const ChatHistory = ({
  history,
  onSelectSession,
  onDeleteEntry,
  onNewChat,
  onBack,
}: ChatHistoryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="bg-[#1a1a1a] text-white flex flex-col w-full h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-700/50 shrink-0">
        <button
          onClick={onBack}
          className="cursor-pointer text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold">Chat History</p>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p className="text-xs">No past conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {history.map((entry) => {
              const msgs = entry.messages ?? [];
              return (
                <div key={entry.sessionId} className="group relative">
                  <button
                    onClick={() => onSelectSession(entry.sessionId, msgs)}
                    className="cursor-pointer w-full text-left bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2.5 pr-8 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate leading-snug">
                          {entry.preview}
                        </p>
                        {msgs.length > 0 && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {msgs.length} messages
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 mt-0.5">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                  </button>

                  {/* Per-entry delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(entry.sessionId);
                    }}
                    title="Remove this chat"
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-4 pt-2 shrink-0 border-t border-gray-700/50">
        <button
          onClick={onNewChat}
          className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Start New Chat
        </button>
      </div>
    </motion.div>
  );
};
