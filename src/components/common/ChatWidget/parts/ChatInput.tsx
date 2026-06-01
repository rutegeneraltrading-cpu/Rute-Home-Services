import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isPending: boolean;
  hasMessages: boolean;
}

export const ChatInput = ({
  inputValue,
  onInputChange,
  onSend,
  onKeyPress,
  isPending,
  hasMessages,
}: ChatInputProps) => {
  return (
    <div className="relative px-3 pb-3 pt-2 sm:px-4 sm:pb-4 shrink-0">
      {hasMessages && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-transparent to-white pointer-events-none -translate-y-full" />
      )}
      <div className="relative rounded-full p-0.5 bg-green-600">
        <input
          type="text"
          placeholder="Write your question..."
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          disabled={isPending}
          className="bg-white text-gray-900 placeholder-gray-400 w-full rounded-full py-2.5 sm:py-3 pl-3.5 sm:pl-4 pr-10 sm:pr-12 text-sm focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!inputValue.trim() || isPending}
          className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 bg-green-600 text-white rounded-full p-1.5 sm:p-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};
