import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ServiceOptionItem } from '@/lib/types/admin/services';

interface AddOptionsStepProps {
  optionsData: ServiceOptionItem[];
  selectedOptions: Record<string, boolean>;
  setSelectedOptions: (opts: Record<string, boolean>) => void;
  onNext: () => void;
  onBack?: () => void;
}

const AddOptionsStep = ({
  optionsData,
  selectedOptions,
  setSelectedOptions,
  onNext,
  onBack,
}: AddOptionsStepProps) => {
  // Handler for toggling options
  const handleOptionChange = (optionId: string) => {
    setSelectedOptions({
      ...selectedOptions,
      [optionId]: !selectedOptions[optionId],
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select Additional Options</h2>
      <div className="mb-2">
        <Label className="block font-semibold">Options</Label>
      </div>
      <div className="flex flex-col gap-4">
        {optionsData.length === 0 && (
          <div className="text-slate-500">
            No additional options available for this service.
          </div>
        )}
        {optionsData.map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
          >
            <Input
              type="checkbox"
              id={`option-${option.id}`}
              checked={!!selectedOptions[option.id]}
              onChange={() => handleOptionChange(option.id)}
              className="accent-black w-5 h-5"
            />
            <Label htmlFor={`option-${option.id}`} className="flex-1">
              <span className="font-semibold">{option.name}</span>
              {option.description && (
                <span className="ml-2 text-slate-500 text-sm">
                  {option.description}
                </span>
              )}
            </Label>
            <span className="text-green-700 font-bold">+R{option.price}</span>
            {option.duration_minutes ? (
              <span className="ml-2 text-xs text-slate-400">
                +{option.duration_minutes} min
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-8">
        {onBack ? (
          <button
            type="button"
            className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300"
            onClick={onBack}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AddOptionsStep;
