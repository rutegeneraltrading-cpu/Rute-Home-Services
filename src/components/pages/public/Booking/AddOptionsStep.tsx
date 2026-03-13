import { Button, Input, Label } from '@/components/ui';
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
    <div className="border bg-white rounded-lg p-4 sm:p-5">
      <div className="mb-2">
        <Label className="block font-semibold mb-3 text-base">Options</Label>
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
            className={`flex flex-col sm:flex-row sm:items-center items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedOptions[option.id]
                ? 'border-black bg-green-50'
                : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
            onClick={() => handleOptionChange(option.id)}
          >
            <Input
              type="checkbox"
              id={`option-${option.id}`}
              checked={!!selectedOptions[option.id]}
              onClick={(e) => e.stopPropagation()}
              onChange={() => handleOptionChange(option.id)}
              className="accent-black w-5 h-5"
            />
            <Label
              htmlFor={`option-${option.id}`}
              className="flex-1 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-semibold">{option.name}</span>
              {option.description && (
                <span className="ml-2 text-slate-500 text-sm">
                  {option.description}
                </span>
              )}
            </Label>
            <div className="sm:ml-auto flex items-center gap-2">
              <span className="text-green-700 font-bold">+R{option.price}</span>
              {option.duration_minutes ? (
                <span className="text-xs text-slate-400">
                  +{option.duration_minutes} min
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 gap-3">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="px-4 w-full sm:w-auto"
          >
            Back
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Button type="button" onClick={onNext} className="px-4 w-full sm:w-auto">
          Next
        </Button>
      </div>
    </div>
  );
};

export default AddOptionsStep;
