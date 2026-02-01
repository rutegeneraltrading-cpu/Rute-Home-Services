'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSignOut } from '@/lib/client/api';


const User = () => {
  const signOutMutation = useSignOut();
  const router = useRouter();
  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  return (
    <div className="flex justify-between items-center border-b py-4 px-8">
      <div className="font-bold text-2xl">User Dashboard</div>
      <Button
        onClick={handleSignOut}
        disabled={signOutMutation.isPending}
        className="flex items-center cursor-pointer"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>{signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
      </Button>
    </div>
  );
};

export default User;
