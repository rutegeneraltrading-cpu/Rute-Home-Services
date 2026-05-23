import { suggestions } from '../utils';

interface WelcomeScreenProps {
  onSuggestionClick: (question: string) => void;
}

export const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between overflow-hidden">
      <div className="flex flex-col items-center justify-center mt-16">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 sm:mb-4 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full glowing-circle"></div>
        </div>
        <p className="text-base sm:text-lg">How can I help you?</p>
      </div>
      <div className="flex gap-3 w-full overflow-x-auto px-3 pb-2 no-scrollbar">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.question)}
            className="flex flex-col cursor-pointer min-w-[200px] sm:min-w-[240px] bg-gray-800 p-3 rounded-lg text-left text-sm hover:bg-gray-700 transition-colors"
          >
            <p className="font-semibold">{suggestion.title}</p>
            <p className="text-xs text-gray-400 truncate">
              {suggestion.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
