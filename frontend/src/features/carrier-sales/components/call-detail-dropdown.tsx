'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { apiService, type Call, type Load } from '@/lib/api-service';

type CallDetails = Call;

interface CallDetailDropdownProps {
  callId: number;
}

export function CallDetailDropdown({ callId }: CallDetailDropdownProps) {
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
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
        } catch (error: any) {
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDiscount = () => {
    if (callDetails.initial_offer && callDetails.final_price) {
      return ((callDetails.initial_offer - callDetails.final_price) / callDetails.initial_offer * 100).toFixed(1);
    }
    return '0';
  };

  const getPriceProgressionData = () => {
    if (!callDetails.initial_offer || !callDetails.final_price) return [];

    const steps = callDetails.negotiation_rounds || 1;
    const initialOffer = callDetails.initial_offer;
    const finalPrice = callDetails.final_price;
    const priceStep = (initialOffer - finalPrice) / steps;

    return Array.from({ length: steps + 1 }, (_, i) => ({
      round: i === 0 ? 'Initial' : i === steps ? 'Final' : `Round ${i}`,
      price: initialOffer - (priceStep * i),
    }));
  };

  const getNegotiationEfficiencyData = () => [
    { name: 'This Call', rounds: callDetails.negotiation_rounds },
    { name: 'Average', rounds: 2.3 },
  ];

  const getBarColor = (index: number) => {
    if (hoveredBar === index) {
      return index === 0 ? '#2563EB' : '#60A5FA'; // Darker on hover
    }
    return index === 0 ? '#3B82F6' : '#93C5FD'; // Normal colors
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: {typeof entry.value === 'number' ?
                (entry.dataKey === 'price' ? `$${entry.value.toLocaleString()}` : entry.value) :
                entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Call Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Call Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Load ID</span>
              <span className="text-xs font-medium">{callDetails.load_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">MC Number</span>
              <span className="text-xs font-medium">{callDetails.carrier_mc_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Duration</span>
              <span className="text-xs font-medium">{formatDuration(callDetails.duration_seconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Sentiment</span>
              <Badge
                variant={callDetails.sentiment === 'positive' ? 'default' : callDetails.sentiment === 'negative' ? 'destructive' : 'secondary'}
                className="text-xs h-5"
              >
                {callDetails.sentiment}
              </Badge>
            </div>
          </CardContent>
        </Card>

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
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Negotiation Rounds</span>
              <span className="text-xs font-medium">{callDetails.negotiation_rounds}</span>
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

      {/* Charts Section */}
      {(callDetails.final_price || callDetails.negotiation_rounds > 0) && (
        <div className={`grid grid-cols-1 gap-4 ${callDetails.final_price ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
          {/* Price Progression Chart */}
          {callDetails.final_price && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-center">Price Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getPriceProgressionData()} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis
                        dataKey="round"
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        stroke="#6B7280"
                      />
                      <YAxis
                        domain={[
                          (dataMin: number) => Math.floor(dataMin * 0.95),
                          (dataMax: number) => Math.ceil(dataMax * 1.05)
                        ]}
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        stroke="#6B7280"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 3 }}
                        name="Price"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negotiation Efficiency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-center">Negotiation Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getNegotiationEfficiencyData()}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    onMouseMove={(data) => {
                      if (data && data.activeTooltipIndex !== undefined) {
                        setHoveredBar(data.activeTooltipIndex);
                      }
                    }}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      stroke="#6B7280"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      stroke="#6B7280"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar
                      dataKey="rounds"
                      radius={[4, 4, 0, 0]}
                      name="Rounds"
                    >
                      {getNegotiationEfficiencyData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(index)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}