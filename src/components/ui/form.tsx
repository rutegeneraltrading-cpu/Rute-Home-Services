import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';

interface FormFieldProps {
  name: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, ...props }, ref) => (
    <div className="space-y-2">
      {label && <Label htmlFor={props.name}>{label}</Label>}
      <Input ref={ref} {...props} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  ),
);

FormField.displayName = 'FormField';

export const Form = ({
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form {...props}>{children}</form>
);

export const FormControl = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

export const FormDescription = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="text-sm text-muted-foreground" {...props}>
    {children}
  </p>
);

export const FormItem = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-2" {...props}>
    {children}
  </div>
);

export const FormLabel = ({
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className="text-sm font-medium" {...props}>
    {children}
  </label>
);

export const FormMessage = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className="text-sm text-red-500" {...props}>
    {children}
  </span>
);
