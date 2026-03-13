'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ServiceForm,
  ServiceOptionsForm,
  ServiceCategoryForm,
  ServiceRequirementsForm,
} from '@/components/pages/admin/serviceForms';

const NewServicePage = () => {
  const [step, setStep] = useState<
    'category' | 'service' | 'options' | 'requirements'
  >('category');

  return (
    <div className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Service Hierarchy</h1>
        <p className="text-gray-600 mt-2">
          Step 1: Category → Step 2: Service → Step 3: Options → Step 4:
          Requirements
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={() => setStep('category')}
          variant={step === 'category' ? 'default' : 'outline'}
        >
          1. Category
        </Button>
        <Button
          onClick={() => setStep('service')}
          variant={step === 'service' ? 'default' : 'outline'}
        >
          2. Service
        </Button>
        <Button
          onClick={() => setStep('requirements')}
          variant={step === 'requirements' ? 'default' : 'outline'}
        >
          3. Requirements
        </Button>
        <Button
          onClick={() => setStep('options')}
          variant={step === 'options' ? 'default' : 'outline'}
        >
          4. Options
        </Button>
      </div>

      {/* Content */}
      <Card className="md:p-6 md:border border-hidden md:shadow-sm shadow-none">
        {step === 'category' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Service Category</h2>
            <ServiceCategoryForm />
          </div>
        )}

        {step === 'service' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Service</h2>
            <ServiceForm />
          </div>
        )}

        {step === 'options' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Service Options</h2>
            <ServiceOptionsForm />
          </div>
        )}

        {step === 'requirements' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              Service Requirements
            </h2>
            <ServiceRequirementsForm />
          </div>
        )}
      </Card>
    </div>
  );
};

export default NewServicePage;
