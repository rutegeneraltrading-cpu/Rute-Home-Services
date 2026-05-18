'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage, SignupPage } from '@/components/pages/auth';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

interface AuthRequiredModalProps {
  open: boolean;
  isAuthenticated: boolean;
  onOpenChange?: (open: boolean) => void;
  onAuthenticated?: () => void;
  title?: string;
  description?: string;
}

const AuthRequiredModal = ({
  open,
  isAuthenticated,
  onOpenChange,
  onAuthenticated,
  title = 'Login Required',
  description = 'You need to be logged in to continue.',
}: AuthRequiredModalProps) => {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
  };

  const handleAuthSuccess = () => {
    onAuthenticated?.();
    onOpenChange?.(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col max-h-[90dvh] sm:max-h-[85dvh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="pt-4 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              type="button"
              variant={authMode === 'login' ? 'default' : 'outline'}
              onClick={() => setAuthMode('login')}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={authMode === 'signup' ? 'default' : 'outline'}
              onClick={() => setAuthMode('signup')}
            >
              Sign Up
            </Button>
          </div>

          {authMode === 'login' ? (
            <LoginPage
              className="mt-0 shadow-none border-0 p-0"
              hideFooterLinks
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <SignupPage
              className="mt-0 shadow-none border-0 p-0"
              hideFooterLinks
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredModal;
