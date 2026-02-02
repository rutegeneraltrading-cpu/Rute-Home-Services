'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ProductCategoryForm,
  ProductForm,
} from '@/components/pages/admin/productForms';

const NewProductPage = () => {
  const [step, setStep] = useState<'category' | 'product'>('category');

  return (
    <div className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Products</h1>
        <p className="text-gray-600 mt-2">Step 1: Category → Step 2: Product</p>
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
          onClick={() => setStep('product')}
          variant={step === 'product' ? 'default' : 'outline'}
        >
          2. Product
        </Button>
      </div>

      {/* Content */}
      <Card className="p-6">
        {step === 'category' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Product Category</h2>
            <ProductCategoryForm
              onSuccess={() => {
                // Optionally auto-switch to product step after category created
                // setStep('product');
              }}
            />
          </div>
        )}

        {step === 'product' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Product</h2>
            <ProductForm />
          </div>
        )}
      </Card>
    </div>
  );
};

export default NewProductPage;
