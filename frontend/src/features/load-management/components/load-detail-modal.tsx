'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  IconClock,
  IconTruck,
  IconCurrencyDollar,
  IconPhone,
} from '@tabler/icons-react';
import { type Load, type Call, apiService } from '@/lib/api-service';

interface LoadDetailModalProps {
  load: Load;
  isOpen: boolean;
  onClose: () => void;
}

export function LoadDetailModal({ load, isOpen, onClose }: LoadDetailModalProps) {
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && load.load_id) {
      const fetchCallHistory = async () => {
        try {
          setLoading(true);
          const calls = await apiService.getLoadCallHistory(load.load_id);
          setCallHistory(calls);
        } catch (error) {
          console.error('Failed to fetch call history:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCallHistory();
    }
  }, [isOpen, load.load_id]);

  const formatCurrency = (value?: number) =>
    value ? `$${value.toLocaleString()}` : 'N/A';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getCallOutcomeBadge = (outcome: string) => {
    const badges = {
      booked: <Badge variant="default">Booked</Badge>,
      rejected: <Badge variant="destructive">Rejected</Badge>,
      failed_negotiation: <Badge variant="secondary">Failed</Badge>,
      ineligible: <Badge variant="outline">Ineligible</Badge>,
    };
    return badges[outcome as keyof typeof badges] || <Badge variant="outline">{outcome}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none! w-[80vw] h-[85vh] overflow-y-auto" style={{ maxWidth: 'none' }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Load {load.load_id}
            </DialogTitle>
          </div>
          <DialogDescription>
            Route: {load.origin} → {load.destination}
          </DialogDescription>
        </DialogHeader>

        {/* Load Details - Card Layout */}
        <div className="mb-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
            load.status !== 'available' && load.booked_carrier_name ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          }`}>
            <div className="rounded-lg bg-card hover:bg-card/80 transition-colors p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <IconClock className="size-4 text-muted-foreground" />
                <h4 className="font-medium">Schedule</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Pickup:</span>
                  <p className="text-card-foreground">{formatDate(load.pickup_datetime)}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Delivery:</span>
                  <p className="text-card-foreground">{formatDate(load.delivery_datetime)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-card hover:bg-card/80 transition-colors p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <IconTruck className="size-4 text-muted-foreground" />
                <h4 className="font-medium">Equipment & Load</h4>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Type:</span>
                  <p className="text-card-foreground">{load.equipment_type}</p>
                </div>
                {load.commodity_type && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Commodity:</span>
                    <p className="text-card-foreground">{load.commodity_type}</p>
                  </div>
                )}
                {load.weight && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Weight:</span>
                    <p className="text-card-foreground">{load.weight.toLocaleString()} lbs</p>
                  </div>
                )}
                {load.miles && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Miles:</span>
                    <p className="text-card-foreground">{load.miles}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-card hover:bg-card/80 transition-colors p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <IconCurrencyDollar className="size-4 text-muted-foreground" />
                <h4 className="font-medium">Pricing</h4>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Loadboard Rate:</span>
                  <p className="text-card-foreground">{formatCurrency(load.loadboard_rate)}</p>
                </div>
                {load.booked_rate && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Booked Rate:</span>
                    <p className="text-card-foreground">{formatCurrency(load.booked_rate)}</p>
                  </div>
                )}
                {load.margin_dollars !== undefined && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Margin:</span>
                    <p className={load.margin_dollars >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {formatCurrency(load.margin_dollars)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {load.status !== 'available' && load.booked_carrier_name && (
              <div className="rounded-lg bg-card hover:bg-card/80 transition-colors p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <IconPhone className="size-4 text-muted-foreground" />
                  <h4 className="font-medium">Assigned Carrier</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-muted-foreground">Name:</span>
                    <p className="text-card-foreground">{load.booked_carrier_name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">MC:</span>
                    <p className="text-card-foreground">{load.booked_carrier_mc}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call History - Full Width */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Call History</h3>

          {loading ? (
            <div className="text-muted-foreground">Loading call history...</div>
          ) : callHistory.length === 0 ? (
            <div className="text-muted-foreground">No calls recorded for this load</div>
          ) : (
            <div>
              <div className="space-y-3">
                {callHistory.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">
                        {call.carrier_name || 'Unknown Carrier'}
                      </div>
                      {getCallOutcomeBadge(call.outcome)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <div className="font-medium text-foreground">MC Number</div>
                        <div>{call.carrier_mc_number}</div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Date & Time</div>
                        <div>{call.created_at ? formatDate(call.created_at) : 'N/A'}</div>
                      </div>
                      {call.duration_seconds && (
                        <div>
                          <div className="font-medium text-foreground">Duration</div>
                          <div>{Math.round(call.duration_seconds / 60)} minutes</div>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">Sentiment</div>
                        <div className="capitalize">{call.sentiment}</div>
                      </div>
                      {call.initial_offer && (
                        <div>
                          <div className="font-medium text-foreground">Initial Offer</div>
                          <div>{formatCurrency(call.initial_offer)}</div>
                        </div>
                      )}
                      {call.final_price && (
                        <div>
                          <div className="font-medium text-foreground">Final Price</div>
                          <div>{formatCurrency(call.final_price)}</div>
                        </div>
                      )}
                      {call.negotiation_rounds > 0 && (
                        <div>
                          <div className="font-medium text-foreground">Negotiation Rounds</div>
                          <div>{call.negotiation_rounds}</div>
                        </div>
                      )}
                    </div>

                    {call.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="font-medium text-sm mb-1">Notes</div>
                        <div className="text-sm text-muted-foreground italic">{call.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes Section - Full Width */}
        {load.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Notes</h3>
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              {load.notes}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}