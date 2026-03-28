import * as React from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, label, ...props }, ref) => {
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 40,
            height: 22,
            borderRadius: 12,
            background: checked ? '#facc15' : '#e5e7eb',
            position: 'relative',
            transition: 'background 0.2s',
            display: 'inline-block',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            ref={ref}
            style={{
              opacity: 0,
              width: 40,
              height: 22,
              position: 'absolute',
              left: 0,
              top: 0,
              margin: 0,
              cursor: 'pointer',
            }}
            {...props}
          />
          <span
            style={{
              position: 'absolute',
              left: checked ? 20 : 2,
              top: 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'left 0.2s',
            }}
          />
        </span>
        {label && (
          <span
            style={{ color: checked ? '#b45309' : '#374151', fontWeight: 500 }}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);
Switch.displayName = 'Switch';
