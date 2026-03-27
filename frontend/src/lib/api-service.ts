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
    outcome: string;
    sentiment: string;
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'test-key';

class ApiService {
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async getDashboardMetrics(): Promise<CallStats> {
    return this.fetchApi<CallStats>('/api/v1/dashboard');
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.fetchApi<DashboardSummary>('/api/v1/dashboard/summary');
  }

  async getCalls(): Promise<Call[]> {
    return this.fetchApi<Call[]>('/api/v1/calls');
  }

  async getCall(callId: number): Promise<Call> {
    return this.fetchApi<Call>(`/api/v1/calls/${callId}`);
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
    const endpoint = `/api/v1/loads${queryString ? `?${queryString}` : ''}`;

    return this.fetchApi<Load[]>(endpoint);
  }

  async getLoad(loadId: string): Promise<Load> {
    return this.fetchApi<Load>(`/api/v1/loads/${loadId}`);
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
    return this.fetchApi('/api/v1/calls', {
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
    return this.fetchApi('/api/v1/verify-carrier', {
      method: 'POST',
      body: JSON.stringify({ mc_number: mcNumber }),
    });
  }
}

export const apiService = new ApiService();