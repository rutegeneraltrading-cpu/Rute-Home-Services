import { AdminSidebar, ProtectedLayout } from '@/components/admin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8">{children}</main>
      </div>
    </ProtectedLayout>
  );
}
