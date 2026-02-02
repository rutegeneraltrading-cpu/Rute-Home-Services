'use client';

import { ServiceOptionsForm } from '@/components/pages/admin/serviceForms/ServiceOptionsForm';
import { useGetServices } from '@/lib/client/api/services/services.query';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ServiceOptionsPageProps {
  params: {
    id: string;
  };
}

export default function ServiceOptionsPage({
  params,
}: ServiceOptionsPageProps) {
  const { data: services, isLoading } = useGetServices();
  const service = services?.find((s) => s.id === params.id);

  if (isLoading) {
    return (
      <div className="py-10">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Service Not Found</h1>
          <Link href="/admin/services">
            <Button>Back to Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="mb-6">
        <Link href="/admin/services">
          <Button variant="outline">← Back to Services</Button>
        </Link>
      </div>

      <ServiceOptionsForm serviceId={params.id} serviceName={service.name} />
    </div>
  );
}
