import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';

type ToastOptions = ExternalToast & {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
};

function toast(options: ToastOptions) {
  const { title, description, variant = 'default', ...rest } = options;

  if (variant === 'destructive') {
    return sonnerToast.error(title as string, {
      description: description as string,
      ...rest,
    });
  }

  if (variant === 'success') {
    return sonnerToast.success(title as string, {
      description: description as string,
      ...rest,
    });
  }

  return sonnerToast(title as string, {
    description: description as string,
    ...rest,
  });
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { useToast, toast };
