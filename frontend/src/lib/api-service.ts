'use client';

export interface CallStats {
  total_calls: number;
  booked_calls: number;
  rejected_calls: number;
  failed_negotiations: number;
  ineligible_carriers: number;
  average_negotiation_rounds: number;
  average_discount_percentage: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  conversion_rate: number;
}

export interface Call {
  id: number;
  carrier_mc_number: string;
  carrier_name?: string;
  load_id?: string;
  outcome: 'booked' | 'rejected' | 'failed_negotiation' | 'ineligible';
  sentiment: 'positive' | 'neutral' | 'negative';
  initial_offer?: number;
  final_price?: number;
  negotiation_rounds: number;
  extracted_data?: any;
  notes?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface DashboardSummary {
  metrics: CallStats;
  recent_calls: Array<{
    id: number;
    carrier_name?: string;
    carrier_mc_number: string;
    load_id?: string;
    outcome: string;
    sentiment: string;
    duration_seconds?: number;
    created_at?: string;
  }>;
  top_carriers: Array<{
    name: string;
    call_count: number;
  }>;
}

export interface Load {
  load_id: string;
  origin: string;
  destination: string;
  pickup_datetime: string;
  delivery_datetime: string;
  equipment_type: string;
  loadboard_rate: number;
  weight?: number;
  commodity_type?: string;
  miles?: number;
  notes?: string;
  status: string;
  booked_carrier_mc?: string;
  booked_carrier_name?: string;
  booked_rate?: number;
  margin_dollars?: number;
  customer_confirmed: boolean;
  urgency_level: string;
  created_at: string;
  updated_at: string;
}

export interface LoadMetrics {
  total_loads: number;
  available_loads: number;
  booked_loads: number;
  in_transit_loads: number;
  delivered_loads: number;
  cancelled_loads: number;
  coverage_rate: number;
  average_margin: number;
  total_margin: number;
  urgent_loads: number;
}

export interface LoadStatusUpdate {
  status: string;
  booked_carrier_mc?: string;
  booked_carrier_name?: string;
  booked_rate?: number;
  customer_confirmed?: boolean;
  urgency_level?: string;
}

class ApiService {
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async getDashboardMetrics(): Promise<CallStats> {
    return this.fetchApi<CallStats>('/api/dashboard');
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.fetchApi<DashboardSummary>('/api/dashboard/summary');
  }

  async getCalls(): Promise<Call[]> {
    return this.fetchApi<Call[]>('/api/calls');
  }

  async getCall(callId: number): Promise<Call> {
    return this.fetchApi<Call>(`/api/calls/${callId}`);
  }

  async getLoads(filters?: {
    origin?: string;
    destination?: string;
    equipment_type?: string;
  }): Promise<Load[]> {
    const params = new URLSearchParams();
    if (filters?.origin) params.append('origin', filters.origin);
    if (filters?.destination) params.append('destination', filters.destination);
    if (filters?.equipment_type) params.append('equipment_type', filters.equipment_type);

    const queryString = params.toString();
    const endpoint = `/api/loads${queryString ? `?${queryString}` : ''}`;

    return this.fetchApi<Load[]>(endpoint);
  }

  async getLoad(loadId: string): Promise<Load> {
    return this.fetchApi<Load>(`/api/loads/${loadId}`);
  }

  async recordCall(callData: {
    carrier_mc_number: string;
    carrier_name?: string;
    load_id?: string;
    outcome: 'booked' | 'rejected' | 'failed_negotiation' | 'ineligible';
    sentiment: 'positive' | 'neutral' | 'negative';
    initial_offer?: number;
    final_price?: number;
    negotiation_rounds?: number;
    extracted_data?: any;
    notes?: string;
    duration_seconds?: number;
  }): Promise<{ id: number; created_at: string; success: boolean }> {
    return this.fetchApi('/api/calls', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async verifyCarrier(mcNumber: string): Promise<{
    mc_number: string;
    carrier_name?: string;
    is_eligible: boolean;
    authority_status?: string;
    out_of_service?: boolean;
    error?: string;
  }> {
    return this.fetchApi('/api/verify-carrier', {
      method: 'POST',
      body: JSON.stringify({ mc_number: mcNumber }),
    });
  }

  // Load Management Methods
  async getLoadMetrics(): Promise<LoadMetrics> {
    return this.fetchApi<LoadMetrics>('/api/loads/metrics');
  }

  async getAvailableLoads(): Promise<Load[]> {
    return this.fetchApi<Load[]>('/api/loads/available');
  }

  async getBookedLoads(): Promise<Load[]> {
    return this.fetchApi<Load[]>('/api/loads/booked');
  }

  async updateLoadStatus(loadId: string, statusUpdate: LoadStatusUpdate): Promise<Load> {
    return this.fetchApi<Load>(`/api/loads/${loadId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusUpdate),
    });
  }

  async getLoadCallHistory(loadId: string): Promise<Call[]> {
    return this.fetchApi<Call[]>(`/api/loads/${loadId}/calls`);
  }

  async bookLoadManually(
    loadId: string,
    carrierMc: string,
    carrierName: string,
    bookedRate: number
  ): Promise<Load> {
    return this.fetchApi<Load>(`/api/loads/${loadId}/book`, {
      method: 'POST',
      body: JSON.stringify({
        carrier_mc: carrierMc,
        carrier_name: carrierName,
        booked_rate: bookedRate,
      }),
    });
  }
}

export const apiService = new ApiService();