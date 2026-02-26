import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Toggle selection
  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  // Show truncated selected labels with count if overflow
  let displayText = placeholder;
  if (selectedLabels.length > 0) {
    const joined = selectedLabels.join(', ');
    // Limit to 30 chars, show count if overflow
    if (joined.length > 30) {
      displayText = `${joined.slice(0, 30)}... (+${selectedLabels.length})`;
    } else {
      displayText = joined;
    }
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left truncate"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        style={{
          maxWidth: '100%',
          minHeight: 40,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="truncate block"
          style={{
            maxWidth: 'calc(100% - 24px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            verticalAlign: 'middle',
          }}
        >
          {selectedLabels.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            displayText
          )}
        </span>
      </Button>
      {open && (
        <div
          className="absolute z-20 mt-2 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto"
          tabIndex={-1}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleSelect(option.value)}
                className="mr-2"
                disabled={disabled}
              />
              <span className="truncate flex-1">{option.label}</span>
              {value.includes(option.value) && (
                <Check size={16} className="ml-2 text-primary" />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
