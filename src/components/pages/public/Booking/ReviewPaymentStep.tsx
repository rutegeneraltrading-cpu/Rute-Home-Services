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
    <div className="max-w-150">
      <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
        Review & Payment
      </h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Category:</Label>
          <span className="text-gray-900 font-medium">{categoryData.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Service:</Label>
          <span className="text-gray-900 font-medium">{serviceData.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Base Price:</Label>
          <span className="text-gray-900">R{serviceData.base_price}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Base Duration:</Label>
          <span className="text-gray-900">
            {serviceData.duration_minutes} min
          </span>
        </div>
        <div>
          <Label className="font-semibold text-gray-700">
            Selected Options:
          </Label>
          {selectedOptionsArray.length === 0 ? (
            <span className="ml-2 text-slate-500">None</span>
          ) : (
            <ul className="ml-4 mt-2 list-disc text-gray-800">
              {selectedOptionsArray.map((opt) => (
                <li key={opt.id} className="mb-1">
                  <span className="font-medium">{opt.name}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    (+R{opt.price}, +{opt.duration_minutes || 0} min)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Address:</Label>
          <span className="text-gray-900">{addressDateData.address}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Date:</Label>
          <span className="text-gray-900">{addressDateData.date}</span>
        </div>
        <div className="flex justify-between items-center">
          <Label className="font-semibold text-gray-700">Time:</Label>
          <span className="text-gray-900">{addressDateData.time}</span>
        </div>
        <div className="flex flex-col items-center mt-6">
          <div className="bg-slate-100 rounded-xl px-6 py-3 mb-2 w-full text-center">
            <span className="font-bold text-xl text-green-700">
              Total Price: R{totalPrice}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl px-6 py-2 w-full text-center">
            <span className="font-semibold text-lg">
              Total Duration: {totalDuration} min
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10">
        <button
          type="button"
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 font-semibold text-gray-700 transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-linear-to-r from-black to-gray-800 text-white font-bold shadow hover:from-gray-800 hover:to-black transition"
          disabled
        >
          Pay (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default ReviewPaymentStep;
