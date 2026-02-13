'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar, ProtectedLayout } from '@/components/admin';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => {
    if (!pathname) return 'Admin';

    const map: Array<{ path: string; title: string }> = [
      { path: '/admin/products', title: 'Products' },
      { path: '/admin/services', title: 'Services' },
      { path: '/admin/orders', title: 'Orders' },
      { path: '/admin/bookings', title: 'Bookings' },
      { path: '/admin/users', title: 'Users' },
      { path: '/admin/workers', title: 'Workers' },
      { path: '/admin/reports', title: 'Reports' },
      { path: '/admin/revenue', title: 'Revenue' },
      { path: '/admin/profile', title: 'Profile' },
      { path: '/admin/contacts', title: 'Contacts' },
    ];

    if (pathname === '/admin') return 'Dashboard';

    const match = map.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    );
    return match?.title ?? 'Admin';
  }, [pathname]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSidebarOpen(!event.matches);
    };
    onChange(mql);
    mql.addEventListener(
      'change',
      onChange as (event: MediaQueryListEvent) => void,
    );
    return () =>
      mql.removeEventListener(
        'change',
        onChange as (event: MediaQueryListEvent) => void,
      );
  }, []);

  return (
    <ProtectedLayout>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AdminSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <header className="sticky top-0 z-40 flex h-15.25 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur">
            <SidebarTrigger className="mr-2" />
            <span className="text-base font-medium text-muted-foreground">
              {pageTitle}
            </span>
          </header>
          <main className="flex-1 px-6 py-6 md:py-10">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
}
