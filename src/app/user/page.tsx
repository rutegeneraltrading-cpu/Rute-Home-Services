'use client';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/context';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const User = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };
  return (
    <div className="flex justify-between items-center border-b py-4 px-8">
      <div className="font-bold text-2xl">User Dashboard</div>
      <Button
        onClick={handleSignOut}
        className="flex items-center cursor-pointer"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign Out</span>
      </Button>
    </div>
  );
};

export default User;
