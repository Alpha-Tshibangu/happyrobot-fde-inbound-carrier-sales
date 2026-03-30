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
  carrier_mc_number: string;
  load_id?: string;
  outcome: string;
  sentiment: string;
  duration_seconds?: number;
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
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <TableHead>Load ID</TableHead>
              <TableHead>MC Number</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <React.Fragment key={call.id}>
                <TableRow
                  className={`cursor-pointer relative ${expandedCallId === call.id ? 'border-b-0' : ''}`}
                  onClick={() => {
                    setExpandedCallId(expandedCallId === call.id ? null : call.id);
                  }}
                >
                  <TableCell className="font-medium">#{call.id}</TableCell>
                  <TableCell className="font-medium">
                    {call.load_id || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {call.carrier_mc_number}
                  </TableCell>
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
                  <TableCell>
                    {formatDuration(call.duration_seconds)}
                  </TableCell>
                  <TableCell>
                    {formatDate(call.created_at).date}
                  </TableCell>
                  <TableCell>
                    {formatDate(call.created_at).time}
                  </TableCell>
                </TableRow>
                {expandedCallId === call.id && (
                  <tr>
                    <td colSpan={9} className="p-0 border-b overflow-hidden">
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