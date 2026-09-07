'use client';

import { Check } from 'lucide-react';

export const WORKER_STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Address' },
  { id: 3, label: 'Documents' },
] as const;

export function WorkerStepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1">
      {WORKER_STEPS.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <li
            key={s.id}
            className={`flex items-center ${i < WORKER_STEPS.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  done
                    ? 'border-green-600 bg-green-600 text-white'
                    : active
                      ? 'border-green-600 bg-white text-green-700'
                      : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.id}
              </span>
              <span
                className={`text-xs font-medium ${
                  active || done ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < WORKER_STEPS.length - 1 && (
              <span
                className={`mx-2 h-0.5 flex-1 rounded ${
                  done ? 'bg-green-600' : 'bg-slate-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
