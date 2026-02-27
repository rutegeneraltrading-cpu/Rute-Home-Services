import { Label } from '@/components/ui/label';
import type { Service, ServiceOptionItem } from '@/lib/types/admin/services';

interface ReviewPaymentStepProps {
  serviceData: Service;
  categoryData: any;
  optionsData: ServiceOptionItem[];
  selectedOptions: Record<string, boolean>;
  addressDateData: { address: string; date: string; time: string };
  onBack: () => void;
}

const ReviewPaymentStep = ({
  serviceData,
  categoryData,
  optionsData,
  selectedOptions,
  addressDateData,
  onBack,
}: ReviewPaymentStepProps) => {
  const selectedOptionsArray = optionsData.filter(
    (opt) => selectedOptions[opt.id],
  );
  const totalPrice =
    (serviceData?.base_price || 0) +
    selectedOptionsArray.reduce((sum, opt) => sum + opt.price, 0);
  const totalDuration =
    (serviceData?.duration_minutes || 0) +
    selectedOptionsArray.reduce(
      (sum, opt) => sum + (opt.duration_minutes || 0),
      0,
    );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Review & Payment</h2>
      <div className="mb-6">
        <div className="mb-2">
          <Label className="font-semibold">Category:</Label> {categoryData.name}
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Service:</Label> {serviceData.name}
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Base Price:</Label> R
          {serviceData.base_price}
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Base Duration:</Label>{' '}
          {serviceData.duration_minutes} min
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Selected Options:</Label>
          {selectedOptionsArray.length === 0 ? (
            <span className="ml-2 text-slate-500">None</span>
          ) : (
            <ul className="ml-4 list-disc">
              {selectedOptionsArray.map((opt) => (
                <li key={opt.id}>
                  {opt.name} (+R{opt.price}, +{opt.duration_minutes || 0} min)
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Address:</Label>{' '}
          {addressDateData.address}
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Date:</Label> {addressDateData.date}
        </div>
        <div className="mb-2">
          <Label className="font-semibold">Time:</Label> {addressDateData.time}
        </div>
        <div className="mt-4 font-bold text-lg">
          <Label>Total Price:</Label> R{totalPrice}
        </div>
        <div className="font-semibold text-slate-700">
          <Label>Total Duration:</Label> {totalDuration} min
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <button
          type="button"
          className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          disabled
        >
          Pay (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default ReviewPaymentStep;
