'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetMe, useSignOut } from '@/lib/client/api';
import { useCart } from '@/lib/contexts';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from '@/components/ui';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Shop', href: '/shop' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'Contact', href: '/contact-us' },
];

const PublicNavbar = () => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { data: user } = useGetMe();
  const signOutMutation = useSignOut();
  const { totalItems } = useCart();

  const initials = user?.email
    ? user.email.split('@')[0].split('').slice(0, 2).join('').toUpperCase()
    : 'U';

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/user';
  const profilePath =
    user?.role === 'admin' ? '/admin/profile' : '/user/profile';

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUserMenuEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setUserMenuOpen(true);
  };

  const handleUserMenuLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 120);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur px-4">
      <div className="container mx-auto grid h-16 grid-cols-[auto_auto] items-center justify-between lg:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="text-3xl font-bold text-slate-900"
          aria-label="Home Services"
        >
          RUTE<span className="text-green-600">.</span>
        </Link>

        <nav className="hidden lg:flex items-center justify-self-center gap-6 text-base text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-green-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center justify-self-end gap-2">
          <Link href="/cart" className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          {!user ? (
            <>
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              {/* <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button> */}
              <Button
                asChild
                className="ml-2 bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-md transition-colors"
                aria-label="Become a Worker"
                title="Become a Worker"
              >
                <Link href="/worker/register">
                  <Briefcase className="h-4 w-4 mr-1" /> Become a Worker
                </Link>
              </Button>
            </>
          ) : (
            <DropdownMenu open={userMenuOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-sm cursor-pointer border-none outline-none focus-visible:ring-0"
                  onPointerEnter={handleUserMenuEnter}
                  onPointerLeave={handleUserMenuLeave}
                >
                  {user.avatar_url ? (
                    <Avatar className="h-8 w-8">
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
                  <span className="min-w-0 max-w-32 truncate text-sm font-medium text-slate-700 xl:max-w-40">
                    {user.name || 'User'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                align="end"
                sideOffset={0}
                onPointerEnter={handleUserMenuEnter}
                onPointerLeave={handleUserMenuLeave}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {user.name || 'User'}
                    </span>
                    <span className="break-all text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={dashboardPath}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={profilePath}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex lg:hidden items-center justify-self-end justify-center gap-2">
          <Link href="/cart" className="" onClick={() => setOpen(false)}>
            <Button
              variant="outline"
              className="w-full relative cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 px-2 flex items-center justify-center text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
            <nav className="flex flex-col gap-3 text-sm text-slate-700">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-green-600"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex lg:flex-row flex-col items-center gap-2">
              <Link
                href="/cart"
                className="w-full lg:flex hidden"
                onClick={() => setOpen(false)}
              >
                <Button
                  variant="outline"
                  className="w-full relative cursor-pointer"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart
                  {totalItems > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 px-2 flex items-center justify-center text-xs"
                    >
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>

              {!user ? (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-md transition-colors"
                    aria-label="Become a Worker"
                    title="Become a Worker"
                  >
                    <Link
                      href="/worker/register"
                      onClick={() => setOpen(false)}
                    >
                      <Briefcase className="h-4 w-4 mr-1" /> Become a Worker
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    {user.avatar_url ? (
                      <Avatar className="h-8 w-8">
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
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-slate-700">
                        {user.name || 'User'}
                      </span>
                      <span className="break-all text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={dashboardPath} onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={profilePath} onClick={() => setOpen(false)}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
