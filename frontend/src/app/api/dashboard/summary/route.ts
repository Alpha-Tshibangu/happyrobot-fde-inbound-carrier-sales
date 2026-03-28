import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const API_KEY = process.env.API_KEY || 'test-key';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      // For now, return mock data if the endpoint doesn't exist
      if (response.status === 404) {
        return NextResponse.json({
          totalCalls: 59,
          conversion: 11.86,
          avgNegotiation: 2.0,
          topCarriers: []
        });
      }
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard summary API error:', error);
    // Return mock data as fallback
    return NextResponse.json({
      totalCalls: 59,
      conversion: 11.86,
      avgNegotiation: 2.0,
      topCarriers: []
    });
  }
}