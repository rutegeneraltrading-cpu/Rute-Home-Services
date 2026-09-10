'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Star,
  CalendarDays,
  Wrench,
  FileText,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Loading } from '@/components/common';
import { useGetWorker } from '@/lib/client/api';
import { WorkerEditModal } from '@/components/pages/admin/workerform';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-600',
  suspended: 'bg-red-100 text-red-700',
};

const DOC_STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="wrap-break-word text-sm font-medium text-slate-900">
        {value || '—'}
      </p>
    </div>
  </div>
);

const WorkerDetailsPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workerId = params?.id;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useGetWorker(workerId);
  const worker = data?.worker;

  if (isLoading) return <Loading fullScreen />;

  if (isError || !worker) {
    return (
      <div className="space-y-6 py-10">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/workers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workers
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
            Worker not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const address = worker.primary_address;
  const fullAddress = address
    ? [
        address.line1,
        address.line2,
        address.city,
        address.state_province,
        address.postal_code,
        address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  const documents = worker.worker_documents || [];
  const services = worker.service_details || [];

  return (
    <div className="space-y-6 py-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/workers')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workers
        </Button>
        <Button onClick={() => setIsEditOpen(true)} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit worker
        </Button>
      </div>

      {/* Identity header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:text-left">
          <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
            {worker.avatar_url ? (
              <Image
                src={worker.avatar_url}
                alt={worker.full_name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-2xl font-semibold text-slate-400">
                {worker.full_name?.charAt(0)?.toUpperCase() || 'W'}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-xl font-bold text-slate-900">
                {worker.full_name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  STATUS_BADGE[worker.status || 'active'] ||
                  'bg-slate-100 text-slate-600'
                }`}
              >
                {worker.status || 'active'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-600 sm:justify-start">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400" />
                {worker.rating_avg
                  ? `${Number(worker.rating_avg).toFixed(1)} rating`
                  : 'No ratings yet'}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                Joined{' '}
                {worker.created_at
                  ? new Date(worker.created_at).toLocaleDateString()
                  : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email" value={worker.email} />
              <InfoRow icon={Phone} label="Phone" value={worker.phone} />
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                Services ({services.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {services.map((s, idx) => (
                    <li
                      key={`${s.name}-${idx}`}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">
                          {s.name}
                        </span>
                        {s.category_name && (
                          <span className="text-xs text-slate-400">
                            {s.category_name}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-slate-600">
                        R{Number(s.base_price ?? 0).toFixed(2)}
                        {s.charge_type ? ` / ${s.charge_type}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No services assigned.</p>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Primary address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {address ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoRow
                      icon={MapPin}
                      label="Label"
                      value={address.label}
                    />
                    <InfoRow
                      icon={Phone}
                      label="Address phone"
                      value={address.phone}
                    />
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {fullAddress}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  No address on file.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verification / documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Verification ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc, idx) => {
                  const isImage = doc.file_url?.match(
                    /\.(jpg|jpeg|png|gif|bmp|webp)$/i,
                  );
                  return (
                    <div
                      key={doc.id || idx}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium capitalize text-slate-800">
                          {String(doc.document_type).replace(/_/g, ' ')}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                            DOC_STATUS_BADGE[doc.status] ||
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      {doc.file_url &&
                        (isImage ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block"
                          >
                            <span className="relative block h-40 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                              <Image
                                src={doc.file_url}
                                alt={doc.document_type}
                                fill
                                className="object-contain"
                              />
                            </span>
                          </a>
                        ) : (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="h-4 w-4" />
                            View document
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          </a>
                        ))}
                      {doc.uploaded_at && (
                        <p className="mt-2 text-xs text-slate-400">
                          Uploaded{' '}
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400">
                  No documents uploaded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <WorkerEditModal
        open={isEditOpen}
        worker={isEditOpen ? worker : null}
        onOpenChange={setIsEditOpen}
        onSuccess={() => {
          setIsEditOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default WorkerDetailsPage;
