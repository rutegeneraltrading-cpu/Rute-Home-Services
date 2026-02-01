'use client';

import { useRouter } from 'next/navigation';
import { useGetMe } from '@/lib/api/auth.query';
import { useSignOut } from '@/lib/api/auth.mutation';
import { LogOut, UserRoundPen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui';

export function UserNav() {
  const router = useRouter();
  const { data: user, isLoading } = useGetMe();
  const signOutMutation = useSignOut();

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const initials =
    user?.email?.split('@')[0].split('').slice(0, 2).join('').toUpperCase() ||
    'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-md py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
          disabled={isLoading}
        >
          {user?.avatar_url ? (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </div>
          )}
          <div className="flex flex-col flex-1 text-left overflow-hidden transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {user?.name || (
                <span className="h-4 w-24 bg-muted rounded animate-pulse inline-block" />
              )}
            </span>
            <span className="text-xs text-muted-foreground truncate whitespace-nowrap">
              {user?.email || (
                <span className="h-3 w-32 bg-muted rounded animate-pulse inline-block" />
              )}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-row gap-2">
            {user?.avatar_url ? (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
            )}
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.name || 'Loading...'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href="/admin/profile">
              <UserRoundPen className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
