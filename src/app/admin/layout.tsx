'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar, ProtectedLayout } from '@/components/admin';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui';

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
      { path: '/admin/profile', title: 'Profile' },
    ];

    if (pathname === '/admin') return 'Dashboard';

    const match = map.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    );
    return match?.title ?? 'Admin';
  }, [pathname]);

  return (
    <ProtectedLayout>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="fixed flex h-15.25 items-center gap-2 border-b w-full px-4">
            <SidebarTrigger className="mr-2" />
            <span className="text-base font-medium text-muted-foreground">
              {pageTitle}
            </span>
          </header>
          <main className="flex-1 px-6 py-20">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
}
