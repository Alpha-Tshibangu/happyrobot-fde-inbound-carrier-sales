'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService, type Call, type Load } from '@/lib/api-service';

type CallDetails = Call;

interface CallDetailDropdownProps {
  callId: number;
}

export function CallDetailDropdown({ callId }: CallDetailDropdownProps) {
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadDetails, setLoadDetails] = useState<Load | null>(null);

  useEffect(() => {
    const fetchCallDetails = async () => {
      try {
        setLoading(true);
        const data = await apiService.getCall(callId);
        setCallDetails(data);
      } catch (error) {
        console.error('Failed to fetch call details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCallDetails();
  }, [callId]);

  // Fetch load details if we have a load_id
  useEffect(() => {
    const fetchLoadDetails = async () => {
      if (callDetails?.load_id) {
        try {
          const load = await apiService.getLoad(callDetails.load_id);
          setLoadDetails(load);
        } catch {
          // Silently handle load not found errors
          setLoadDetails(null);
        }
      }
    };
    if (callDetails) {
      fetchLoadDetails();
    }
  }, [callDetails]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-muted-foreground">Loading call details...</div>
      </div>
    );
  }

  if (!callDetails) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Unable to load call details</div>
      </div>
    );
  }


  const calculateDiscount = () => {
    if (callDetails.initial_offer && callDetails.final_price) {
      return ((callDetails.initial_offer - callDetails.final_price) / callDetails.initial_offer * 100).toFixed(1);
    }
    return '0';
  };


  return (
    <div className="p-6 space-y-6">
      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Initial Offer</span>
              <span className="text-xs font-medium">
                {callDetails.initial_offer ? `$${callDetails.initial_offer.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Final Price</span>
              <span className="text-xs font-medium">
                {callDetails.final_price ? `$${callDetails.final_price.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Discount</span>
              <span className="text-xs font-medium text-red-500">{calculateDiscount()}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Load Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Load Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadDetails ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Route</span>
                  <span className="text-xs font-medium truncate max-w-[120px]" title={`${loadDetails.origin} → ${loadDetails.destination}`}>
                    {loadDetails.origin?.split(',')[0]} → {loadDetails.destination?.split(',')[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Miles</span>
                  <span className="text-xs font-medium">{loadDetails.miles ? `${loadDetails.miles} mi` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Equipment</span>
                  <span className="text-xs font-medium">{loadDetails.equipment_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Weight</span>
                  <span className="text-xs font-medium">{loadDetails.weight ? `${loadDetails.weight.toLocaleString()} lbs` : 'N/A'}</span>
                </div>
              </>
            ) : callDetails.load_id ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Load ID</span>
                  <span className="text-xs font-medium">{callDetails.load_id}</span>
                </div>
                <p className="text-xs text-muted-foreground">Detailed load information not available</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No load associated</p>
            )}
          </CardContent>
        </Card>

        {/* Shipment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Shipment Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadDetails ? (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Commodity</span>
                  <span className="text-xs font-medium truncate max-w-[120px]" title={loadDetails.commodity_type}>
                    {loadDetails.commodity_type || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Board Rate</span>
                  <span className="text-xs font-medium">
                    {loadDetails.loadboard_rate ? `$${loadDetails.loadboard_rate.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Shipment details unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}