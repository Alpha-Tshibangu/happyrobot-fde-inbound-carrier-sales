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
import { CallDetailDropdown } from './call-detail-dropdown';

interface RecentCall {
  id: number;
  carrier_name?: string;
  outcome: string;
  sentiment: string;
  created_at?: string;
}

interface RecentCallsTableProps {
  calls: RecentCall[];
}

export function RecentCallsTable({ calls }: RecentCallsTableProps) {
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null);

  const formatOutcome = (outcome: string) => {
    switch (outcome) {
      case 'failed_negotiation':
        return 'Failed Negotiation';
      default:
        return outcome.charAt(0).toUpperCase() + outcome.slice(1);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (!calls.length) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Recent Calls</h3>
          <p className="text-sm text-muted-foreground">Latest carrier call activity</p>
        </div>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No recent calls available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Recent Calls</h3>
        <p className="text-sm text-muted-foreground">Latest carrier call activity</p>
      </div>
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Call ID</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Date & Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call, index) => (
              <React.Fragment key={call.id}>
                <TableRow
                  className={`cursor-pointer relative ${expandedCallId === call.id ? 'border-b-0' : ''}`}
                  onClick={() => {
                    setExpandedCallId(expandedCallId === call.id ? null : call.id);
                  }}
                >
                  <TableCell className="font-medium">#{call.id}</TableCell>
                  <TableCell>
                    {call.carrier_name || 'Unknown Carrier'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatOutcome(call.outcome)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(call.created_at)}
                  </TableCell>
                </TableRow>
                {expandedCallId === call.id && (
                  <tr>
                    <td colSpan={5} className="p-0 border-b overflow-hidden">
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <CallDetailDropdown callId={call.id} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}