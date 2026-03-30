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
import { type Load } from '@/lib/api-service';
import { LoadDetailModal } from './load-detail-modal';

interface BookedLoadsTableProps {
  loads: Load[];
}

export function BookedLoadsTable({ loads }: BookedLoadsTableProps) {
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  const formatCurrency = (value?: number) =>
    value ? `$${value.toLocaleString()}` : 'N/A';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      booked: <Badge variant="outline">Booked</Badge>,
      in_transit: <Badge variant="outline">In Transit</Badge>,
      delivered: <Badge variant="outline">Delivered</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
  };


  if (!loads.length) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No booked loads at this time
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
              <TableHead className="px-6">Carrier</TableHead>
              <TableHead className="px-6">Margin</TableHead>
              <TableHead className="px-6">Status</TableHead>
              <TableHead className="px-6">Pickup Date</TableHead>
              <TableHead className="px-6">Pickup Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loads.map((load) => (
              <TableRow
                key={load.load_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedLoad(load)}
              >
                <TableCell className="cursor-pointer font-medium px-6">{load.load_id}</TableCell>
                <TableCell className="cursor-pointer px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {load.booked_carrier_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      MC: {load.booked_carrier_mc}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  {formatCurrency(load.margin_dollars)}
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(load.status)}
                    {load.customer_confirmed && (
                      <Badge variant="outline" className="text-xs">
                        Confirmed
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  {formatDate(load.pickup_datetime).date}
                </TableCell>
                <TableCell className="cursor-pointer px-6">
                  {formatDate(load.pickup_datetime).time}
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