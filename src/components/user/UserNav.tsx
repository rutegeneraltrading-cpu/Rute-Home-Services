'use client';

import { useRouter } from 'next/navigation';
import { LogOut, UserRoundPen } from 'lucide-react';
import { useGetMe, useSignOut } from '@/lib/client/api';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '@/components/ui';

export function UserNav() {
  const router = useRouter();
  const { data: user, isLoading } = useGetMe();
  const signOutMutation = useSignOut();

  if (!user && isLoading) {
    return (
      <div className="flex w-full items-center gap-2 rounded-md py-2 px-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-2 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex w-full items-center gap-2 rounded-md py-2 px-2 text-sm text-muted-foreground">
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
          U
        </div>
        <div className="text-xs">Not signed in</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const initials =
    user.email?.split('@')[0].split('').slice(0, 2).join('').toUpperCase() ||
    'U';

  return (
    <>
      
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
                {user.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground truncate whitespace-nowrap">
                {user.email || ''}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-row gap-2">
              {user?.avatar_url ? (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={user.avatar_url}
                    alt={user.name || 'User'}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </div>
              )}
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email || ''}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="/user/profile">
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
    </>
  );
}
