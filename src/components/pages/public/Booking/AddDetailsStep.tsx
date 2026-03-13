import { Button, Label } from '@/components/ui';

interface AdditionalDetails {
  notes: string;
}

interface AddDetailsStepProps {
  details: AdditionalDetails;
  setDetails: (details: AdditionalDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddDetailsStep = ({
  details,
  setDetails,
  onNext,
  onBack,
}: AddDetailsStepProps) => {
  return (
    <div className="border bg-white rounded-lg p-4">
      <div className="mb-2">
        <Label className="block font-semibold mb-3 text-base">
          Notes (Optional)
        </Label>
      </div>
      <div className="space-y-2">
        <textarea
          id="booking-notes"
          value={details.notes}
          onChange={(e) => setDetails({ notes: e.target.value })}
          placeholder="e.g. Please ring the bell, parking is in basement, call before arrival."
          rows={5}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
        />
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
        <Button type="button" onClick={onNext} className="px-4">
          Next
        </Button>
      </div>
    </div>
  );
};

export default AddDetailsStep;
