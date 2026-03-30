'use client';

import React, { useState } from 'react';
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
  IconTruck,
} from '@tabler/icons-react';
import { type Load } from '@/lib/api-service';
import { LoadDetailModal } from './load-detail-modal';

interface AvailableLoadsTableProps {
  loads: Load[];
}

export function AvailableLoadsTable({ loads }: AvailableLoadsTableProps) {
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getUrgencyBadge = (urgencyLevel: string, pickupDate: string) => {
    const pickup = new Date(pickupDate);
    const now = new Date();
    const hoursUntil = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (urgencyLevel === 'high' || hoursUntil < 24) {
      return (
        <Badge variant="destructive" className="text-xs bg-red-700 hover:bg-red-800">
          URGENT
        </Badge>
      );
    } else if (urgencyLevel === 'medium' || hoursUntil < 72) {
      return (
        <Badge variant="secondary" className="text-xs">
          MEDIUM
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs">
          LOW
        </Badge>
      );
    }
  };

  // Sort loads by urgency (urgent first)
  const sortedLoads = [...loads].sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    const urgencyA = urgencyOrder[a.urgency_level as keyof typeof urgencyOrder] ?? 3;
    const urgencyB = urgencyOrder[b.urgency_level as keyof typeof urgencyOrder] ?? 3;

    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB;
    }

    // If same urgency, sort by pickup date (sooner first)
    return new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime();
  });

  if (!loads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <IconTruck className="size-8 mb-2" />
        <div>All loads have carrier coverage</div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="px-6">Load ID</TableHead>
              <TableHead className="px-6">Pickup Date</TableHead>
              <TableHead className="px-6">Pickup Time</TableHead>
              <TableHead className="px-6">Equipment</TableHead>
              <TableHead className="px-6">Rate</TableHead>
              <TableHead className="px-6">Urgency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLoads.map((load) => (
              <TableRow
                key={load.load_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedLoad(load)}
              >
                <TableCell className="cursor-pointer font-medium px-6">{load.load_id}</TableCell>
                <TableCell className="cursor-pointer px-6">
                  {formatDate(load.pickup_datetime).date}
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  {formatDate(load.pickup_datetime).time}
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  <Badge variant="outline" className="text-xs">
                    {load.equipment_type}
                  </Badge>
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  {formatCurrency(load.loadboard_rate)}
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  {getUrgencyBadge(load.urgency_level, load.pickup_datetime)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load Detail Modal */}
      {selectedLoad && (
        <LoadDetailModal
          load={selectedLoad}
          isOpen={!!selectedLoad}
          onClose={() => setSelectedLoad(null)}
        />
      )}
    </>
  );
}