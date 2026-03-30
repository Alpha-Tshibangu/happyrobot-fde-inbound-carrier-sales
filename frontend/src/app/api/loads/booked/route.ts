import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const API_KEY = process.env.API_KEY || 'test-key';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/loads/booked`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Booked loads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booked loads' },
      { status: 500 }
    );
  }
}