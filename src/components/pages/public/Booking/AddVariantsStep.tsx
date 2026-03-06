import { Button, Label, Input } from '@/components/ui';
import type { ServiceOptionVariant } from '@/lib/types/admin/services/variant';

interface AddVariantsStepProps {
  variants: ServiceOptionVariant[];
  selectedVariants: Record<string, string>; // service_option_id -> variant_id
  setSelectedVariants: (variants: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddVariantsStep = ({
  variants,
  selectedVariants,
  setSelectedVariants,
  onNext,
  onBack,
}: AddVariantsStepProps) => {
  // Group variants by service_option_id
  const groupedVariants = variants.reduce(
    (acc, variant) => {
      if (!acc[variant.service_option_id]) {
        acc[variant.service_option_id] = [];
      }
      acc[variant.service_option_id].push(variant);
      return acc;
    },
    {} as Record<string, ServiceOptionVariant[]>,
  );

  const handleVariantChange = (optionId: string, variantId: string) => {
    setSelectedVariants({
      ...selectedVariants,
      [optionId]: variantId,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select Variant Options</h2>
      <p className="text-slate-600 mb-6 text-sm">
        Please select a variant for each option
      </p>
      <div className="flex flex-col gap-6">
        {Object.entries(groupedVariants).map(([optionId, optionVariants]) => {
          // Get the first variant's type to display as the group name
          const variantType = optionVariants[0]?.type || 'Options';

          return (
            <div key={optionId} className="border rounded-lg p-4">
              <Label className="block font-semibold mb-3 text-base">
                {variantType}
              </Label>
              <div className="flex flex-col gap-3">
                {optionVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
                    onClick={() => handleVariantChange(optionId, variant.id)}
                  >
                    <Input
                      type="radio"
                      id={`variant-${variant.id}`}
                      name={`option-${optionId}`}
                      checked={selectedVariants[optionId] === variant.id}
                      onChange={() => handleVariantChange(optionId, variant.id)}
                      className="accent-black w-4 h-4"
                    />
                    <Label
                      htmlFor={`variant-${variant.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-semibold">{variant.name}</span>
                    </Label>
                    <span className="text-green-700 font-bold">
                      +R{variant.price}
                    </span>
                    {variant.duration_minutes > 0 && (
                      <span className="ml-2 text-xs text-slate-400">
                        +{variant.duration_minutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-4"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="px-4"
          disabled={
            Object.keys(groupedVariants).length !==
            Object.keys(selectedVariants).length
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AddVariantsStep;
