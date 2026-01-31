'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/client';

const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/services', label: 'Services' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/workers', label: 'Workers' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg hover:bg-slate-100"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-lg transition-transform duration-300 md:translate-x-0',
          !isOpen && '-translate-x-full',
        )}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-4 py-2 rounded-lg transition-colors',
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800',
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="destructive"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;
