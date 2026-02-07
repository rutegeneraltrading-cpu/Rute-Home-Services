'use client';

import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingCart,
  CreditCard,
  Bell,
  UserRound,
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
import { NavMain, type NavItem } from '@/components/admin';
import { UserNav } from './UserNav';

const UserSidebar = () => {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      url: '/user/dashboard',
      icon: <LayoutDashboard className="size-4" />,
      isActive: pathname === '/user' || pathname === '/user/dashboard',
    },
    {
      title: 'Bookings',
      url: '/user/bookings',
      icon: <CalendarCheck className="size-4" />,
      isActive: pathname.startsWith('/user/bookings'),
    },
    {
      title: 'Orders',
      url: '/user/orders',
      icon: <ShoppingCart className="size-4" />,
      isActive: pathname.startsWith('/user/orders'),
    },
    {
      title: 'Payment History',
      url: '/user/payment-history',
      icon: <CreditCard className="size-4" />,
      isActive: pathname.startsWith('/user/payment-history'),
    },
    {
      title: 'Notifications',
      url: '/user/notifications',
      icon: <Bell className="size-4" />,
      isActive: pathname.startsWith('/user/notifications'),
    },
    {
      title: 'Profile',
      url: '/user/profile',
      icon: <UserRound className="size-4" />,
      isActive: pathname.startsWith('/user/profile'),
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

export default UserSidebar;
