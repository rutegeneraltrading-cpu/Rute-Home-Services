'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui';
import { NavMain, UserNav, type NavItem } from './navigation';

const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: <LayoutDashboard className="size-4" />,
      isActive: pathname === '/admin',
    },
    {
      title: 'Products',
      url: '/admin/products',
      icon: <Package className="size-4" />,
      isActive: pathname.startsWith('/admin/products'),
      items: [
        { title: 'All Products', url: '/admin/products' },
        { title: 'Add Product', url: '/admin/products/new' },
      ],
    },
    {
      title: 'Services',
      url: '/admin/services',
      icon: <Wrench className="size-4" />,
      isActive: pathname.startsWith('/admin/services'),
      items: [
        { title: 'All Services', url: '/admin/services' },
        { title: 'Add Service', url: '/admin/services/new' },
      ],
    },
    {
      title: 'Orders & Bookings',
      url: '/admin/orders',
      icon: <ShoppingCart className="size-4" />,
      isActive:
        pathname.startsWith('/admin/orders') ||
        pathname.startsWith('/admin/bookings'),
      items: [
        { title: 'Orders', url: '/admin/orders' },
        { title: 'Bookings', url: '/admin/bookings' },
      ],
    },
    {
      title: 'Users',
      url: '/admin/users',
      icon: <Users className="size-4" />,
      isActive: pathname.startsWith('/admin/users'),
      items: [
        { title: 'All Users', url: '/admin/users' },
        { title: 'Workers', url: '/admin/workers' },
      ],
    },
    {
      title: 'Analytics',
      url: '/admin/analytics',
      icon: <TrendingUp className="size-4" />,
      isActive: pathname.startsWith('/admin/analytics'),
      items: [
        { title: 'Reports', url: '/admin/reports' },
        { title: 'Revenue', url: '/admin/revenue' },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="gap-2">
        <div className="flex items-center justify-between  py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              R
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-bold transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:hidden">
                RUTE<span className="text-green-600">.</span>
              </span>
            </div>
          </div>
          <SidebarTrigger className="-mr-2 hidden" />
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AdminSidebar;
