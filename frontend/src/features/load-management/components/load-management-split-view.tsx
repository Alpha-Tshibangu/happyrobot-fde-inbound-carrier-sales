'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService, type Load } from '@/lib/api-service';
import { BookedLoadsTable } from './booked-loads-table';
import { AvailableLoadsTable } from './available-loads-table';

export function LoadManagementSplitView() {
  const [bookedLoads, setBookedLoads] = useState<Load[]>([]);
  const [availableLoads, setAvailableLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchLoads = async () => {
      try {
        setLoading(true);
        const [booked, available] = await Promise.all([
          apiService.getBookedLoads(),
          apiService.getAvailableLoads(),
        ]);
        setBookedLoads(booked);
        setAvailableLoads(available);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch loads');
      } finally {
        setLoading(false);
      }
    };

    fetchLoads();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      requestAnimationFrame(() => setShowContent(true));
    } else {
      setShowContent(false);
    }
  }, [loading, error]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booked Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      className={[
        'grid grid-cols-1 gap-6 lg:grid-cols-2 h-full min-h-0',
        'transition-all duration-300 ease-out',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {/* Booked Loads Panel */}
      <Card className="flex flex-col h-full min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
          <CardTitle className="text-lg font-medium">
            Booked Loads
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <BookedLoadsTable loads={bookedLoads} />
        </CardContent>
      </Card>

      {/* Available Loads Panel */}
      <Card className="flex flex-col h-full min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
          <CardTitle className="text-lg font-medium">
            Needs Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <AvailableLoadsTable loads={availableLoads} />
        </CardContent>
      </Card>
    </div>
  );
}