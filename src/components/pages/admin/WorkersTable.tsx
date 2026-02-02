'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Ban, CheckCircle } from 'lucide-react';
import { Worker } from '@/lib/client/api/workers/workers.api';
import {
  useSuspendWorker,
  useUnsuspendWorker,
} from '@/lib/client/api/workers/workers.mutation';

interface WorkersTableProps {
  workers: Worker[];
  isLoading: boolean;
  onEdit?: (worker: Worker) => void;
}

export function WorkersTable({
  workers,
  isLoading,
  onEdit,
}: WorkersTableProps) {
  const suspendMutation = useSuspendWorker();
  const unsuspendMutation = useUnsuspendWorker();

  const handleSuspend = (workerId: string) => {
    suspendMutation.mutate(workerId);
  };

  const handleUnsuspend = (workerId: string) => {
    unsuspendMutation.mutate(workerId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Loading workers...</p>
      </div>
    );
  }

  if (!workers || workers.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">
          No workers found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{worker.full_name}</TableCell>
              <TableCell>{worker.email}</TableCell>
              <TableCell>{worker.phone || '-'}</TableCell>
              <TableCell>
                {worker.hourly_rate ? `R${worker.hourly_rate.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {worker.rating_avg
                  ? `${worker.rating_avg.toFixed(1)} ⭐`
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    worker.status === 'suspended'
                      ? 'destructive'
                      : worker.status === 'active'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {worker.status || 'active'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEdit?.(worker)}
                      className="cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    {worker.status === 'suspended' ? (
                      <DropdownMenuItem
                        onClick={() => handleUnsuspend(worker.id)}
                        className="cursor-pointer text-green-600"
                        disabled={unsuspendMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Reactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleSuspend(worker.id)}
                        className="cursor-pointer text-red-600"
                        disabled={suspendMutation.isPending}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Suspend
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
