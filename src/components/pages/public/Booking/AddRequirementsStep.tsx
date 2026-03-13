import { Button, Label, Input } from '@/components/ui';
import type { ServiceRequirement } from '@/lib/types/admin/services/variant';

interface AddRequirementsStepProps {
  requirements: ServiceRequirement[];
  selectedRequirements: Record<string, string>; // group key -> requirement id
  setSelectedRequirements: (requirements: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddRequirementsStep = ({
  requirements,
  selectedRequirements,
  setSelectedRequirements,
  onNext,
  onBack,
}: AddRequirementsStepProps) => {
  const getFriendlyGroupLabel = (rawType: string) => {
    const normalized = (rawType || '').trim().toLowerCase();
    const labelMap: Record<string, string> = {
      size: 'Size',
      property_size: 'Property Size',
      truck_size: 'Truck Size',
      type: 'Service Type',
    };

    return (
      labelMap[normalized] ||
      rawType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  // Group requirements by type (new) or service_option_id (legacy fallback)
  const groupedRequirements = requirements.reduce(
    (acc, requirement) => {
      const groupKey =
        // legacy shape support (if present)
        (requirement as ServiceRequirement & { service_option_id?: string })
          .service_option_id ||
        requirement.type ||
        'requirements';

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(requirement);
      return acc;
    },
    {} as Record<string, ServiceRequirement[]>,
  );

  const handleRequirementChange = (groupKey: string, requirementId: string) => {
    setSelectedRequirements({
      ...selectedRequirements,
      [groupKey]: requirementId,
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-6">
        {Object.entries(groupedRequirements).map(
          ([groupKey, groupRequirements]) => {
            const groupType = groupRequirements[0]?.type || 'Details';
            const groupLabel = getFriendlyGroupLabel(groupType);

            return (
              <div
                key={groupKey}
                className="border bg-white rounded-lg p-4"
              >
                <Label className="block font-semibold mb-3 text-base">
                  {groupLabel}
                </Label>
                <div className="flex flex-col gap-3">
                  {groupRequirements.map((requirement) => (
                    // Selected state matches service card style
                    <div
                      key={requirement.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRequirements[groupKey] === requirement.id
                          ? 'border-black bg-green-50'
                          : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                      onClick={() =>
                        handleRequirementChange(groupKey, requirement.id)
                      }
                    >
                      <Input
                        type="radio"
                        id={`requirement-${requirement.id}`}
                        name={`group-${groupKey}`}
                        checked={
                          selectedRequirements[groupKey] === requirement.id
                        }
                        onChange={() =>
                          handleRequirementChange(groupKey, requirement.id)
                        }
                        className="accent-black w-4 h-4"
                      />
                      <Label
                        htmlFor={`requirement-${requirement.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-semibold">
                          {requirement.name}
                        </span>
                      </Label>
                      <span className="text-green-700 font-bold">
                        +R{requirement.price}
                      </span>
                      {requirement.duration_minutes > 0 && (
                        <span className="ml-2 text-xs text-slate-400">
                          +{requirement.duration_minutes} min
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          },
        )}
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
            Object.keys(groupedRequirements).length !==
            Object.keys(selectedRequirements).length
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AddRequirementsStep;
