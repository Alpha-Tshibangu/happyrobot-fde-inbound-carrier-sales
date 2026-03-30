import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'generateInsights': {
        try {
          // Check if OpenAI API key is configured
          if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
            throw new Error('OpenAI API key not configured');
          }

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a carrier sales analyst AI. Analyze call data and provide actionable insights about:
                  - Conversion trends and patterns
                  - Sentiment analysis
                  - Negotiation effectiveness
                  - Anomalies and areas of concern
                  - Predictions and recommendations

                  IMPORTANT: Do not use emojis in titles, descriptions, or any text content. Use plain text only as the UI has its own icon system.
                  Format responses as JSON with categories: trends, anomalies, predictions, recommendations.
                  Each insight should have: title, description, priority (high/medium/low), metric, value, actionable (boolean).`
              },
              {
                role: "user",
                content: `Analyze this carrier sales data: ${JSON.stringify(data)}`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1000
          });

          const content = completion.choices[0]?.message?.content || '{}';
          let insights;

          try {
            insights = JSON.parse(content);
          } catch (parseError) {
            console.error('Failed to parse OpenAI response:', parseError);
            throw new Error('Invalid JSON response from OpenAI');
          }

          return NextResponse.json({ insights });
        } catch (apiError: any) {
          console.error('OpenAI API Error:', apiError);

          // Return empty insights object to trigger fallback in frontend
          return NextResponse.json({ insights: null });
        }
      }

      case 'chat': {
        try {
          // Check if OpenAI API key is configured
          if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
            throw new Error('OpenAI API key not configured');
          }

          const { message, context, conversationHistory } = data;

          // Fetch full database access - loads, calls, and detailed records
          let loads = [];
          let calls = [];
          let summary = null;

          try {
            // Fetch loads data
            const loadsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v1/loads`, {
              headers: {
                'x-api-key': process.env.API_KEY!
              }
            });
            if (loadsResponse.ok) {
              loads = await loadsResponse.json();
            }

            // Fetch calls data
            const callsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v1/calls`, {
              headers: {
                'x-api-key': process.env.API_KEY!
              }
            });
            if (callsResponse.ok) {
              calls = await callsResponse.json();
            }

            // Fetch dashboard summary
            const summaryResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/v1/dashboard/summary`, {
              headers: {
                'x-api-key': process.env.API_KEY!
              }
            });
            if (summaryResponse.ok) {
              summary = await summaryResponse.json();
            }
          } catch (fetchError) {
            console.error('Failed to fetch additional data:', fetchError);
          }

          // Analyze loads for booking insights
          const availableLoads = loads.filter((load: any) => load.status === 'available');
          const bookedLoads = loads.filter((load: any) => load.status === 'booked');
          const unbookedUrgentLoads = availableLoads.filter((load: any) => load.urgency_level === 'high');

          // Analyze calls for patterns
          const rejectedCalls = calls.filter((call: any) => call.outcome === 'rejected');
          const failedNegotiations = calls.filter((call: any) => call.outcome === 'failed_negotiation');

          // Calculate additional metrics
          const avgMarginBooked = bookedLoads.length > 0
            ? bookedLoads.reduce((sum: number, load: any) => sum + (load.margin_dollars || 0), 0) / bookedLoads.length
            : 0;

          const avgMarginAvailable = availableLoads.length > 0
            ? availableLoads.reduce((sum: number, load: any) => sum + (load.margin_dollars || 0), 0) / availableLoads.length
            : 0;

          // Build messages array starting with system prompt
          const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            {
              role: "system",
              content: `You are a carrier sales analyst AI with FULL ACCESS to the freight operations database. You can analyze individual loads, calls, and provide deep insights into booking patterns and challenges.

CRITICAL: Never use emojis, emoticons, or symbols (like 💡, 📊, 🔍, etc.) anywhere in your response - not in text, chart titles, insights, or data labels. Use plain text only.

IMPORTANT: Respond with JSON in this exact format:
{
  "response": "Your complete textual analysis and insights here. Include ALL analytical commentary, key findings, data interpretations, business insights, and recommendations in this response field.",
  "chart": {
    "type": "bar|grouped-bar|line|pie|null",
    "title": "Chart title - keep this simple and descriptive",
    "data": [{"name": "Label", "value": number}] OR [{"name": "Label", "current": number, "suggested": number}] for grouped-bar
  },
  "followUpQuestions": ["Question 1", "Question 2", "Question 3"]
}

CRITICAL FORMATTING: Keep responses succinct but use markdown formatting sparingly and strategically:
- Use **bold text** occasionally for key findings or critical metrics
- Use bullet points (- ) or numbered lists (1. ) only when presenting multiple related items
- Don't overformat - most responses should be natural prose with selective emphasis
- Only use lists when you have 2-4 related points to present

CRITICAL CHART GUIDANCE: Only generate charts when they add meaningful value:
- MOST responses should NOT have charts - only when visualization reveals patterns
- Never chart individual items with mixed data (like "Current vs Suggested rates for Load X, Y, Z")
- Questions about WHY something is happening = text analysis, not charts
- Questions asking for specific examples = text response, not visualization
- Only chart when you have grouped, comparable data that shows trends or patterns

FULL DATABASE ACCESS - You have complete visibility into:

AGGREGATE METRICS:
- total_calls: ${context?.metrics?.total_calls || 0}
- booked_calls: ${context?.metrics?.booked_calls || 0}
- conversion_rate: ${context?.metrics?.conversion_rate || 0}%
- average_negotiation_rounds: ${context?.metrics?.average_negotiation_rounds || 0}
- average_discount_percentage: ${context?.metrics?.average_discount_percentage || 0}%
- failed_negotiations: ${context?.metrics?.failed_negotiations || 0}
- sentiment_distribution: positive=${context?.metrics?.sentiment_distribution?.positive || 0}, neutral=${context?.metrics?.sentiment_distribution?.neutral || 0}, negative=${context?.metrics?.sentiment_distribution?.negative || 0}

LOAD DETAILS:
- Total loads: ${loads.length}
- Available loads (need booking): ${availableLoads.length}
- Booked loads: ${bookedLoads.length}
- Urgent unbooked loads: ${unbookedUrgentLoads.length}
- Average margin on booked loads: $${avgMarginBooked.toFixed(2)}
- Average margin on available loads: $${avgMarginAvailable.toFixed(2)}

SPECIFIC LOAD INSIGHTS:
${unbookedUrgentLoads.length > 0 ? `
Urgent loads not getting booked:
${unbookedUrgentLoads.slice(0, 3).map((load: any) =>
  `- Load ${load.load_id}: ${load.origin} to ${load.destination}, Rate: $${load.loadboard_rate}, Pickup: ${new Date(load.pickup_datetime).toLocaleDateString()}`
).join('\n')}` : 'No urgent unbooked loads currently'}

CALL PATTERNS:
- Total calls analyzed: ${calls.length}
- Rejected calls: ${rejectedCalls.length}
- Failed negotiations: ${failedNegotiations.length}
${rejectedCalls.length > 0 ? `
Common rejection reasons from recent calls:
${rejectedCalls.slice(0, 3).map((call: any) =>
  `- ${call.carrier_name || 'Unknown'}: ${call.notes || 'No notes'}`
).join('\n')}` : ''}

TOP CARRIERS (by volume):
${summary?.top_carriers ? summary.top_carriers.slice(0, 5).map((carrier: any) =>
  `- ${carrier.name}: ${carrier.total_calls} calls, ${carrier.booked_loads} booked`
).join('\n') : 'No carrier data available'}

KEY INSIGHTS YOU CAN PROVIDE:
1. Why specific loads aren't getting booked (analyze rate, route, timing patterns)
2. Which carriers are most likely to book certain types of loads
3. Pricing optimization suggestions based on actual booking data
4. Time-to-book analysis for urgent vs. regular loads
5. Carrier sentiment patterns and their impact on bookings
6. Equipment type preferences by carrier
7. Route-specific booking challenges

When asked about WHY loads aren't getting booked, analyze:
- Rate competitiveness (compare margins)
- Timing constraints (pickup windows)
- Route popularity (origin-destination pairs)
- Equipment requirements
- Historical carrier preferences

CRITICAL DATA VISUALIZATION PRINCIPLES:

1. WHEN TO AVOID CHARTS (use null):
   - Simple yes/no answers or single metrics
   - Questions asking "why" (explanatory responses)
   - When you have fewer than 3 meaningful data points
   - When data points are fundamentally different categories that don't compare meaningfully
   - Never create charts that mix incomparable items (like "Current vs Suggested Rate for Load X")

2. BAR CHARTS - Use for comparing discrete categories:
   - ✅ GOOD: "Top 5 carriers by booking volume", "Revenue by route", "Loads by urgency level"
   - ❌ BAD: Single metrics or paired comparisons (use grouped-bar for those)
   - Requirements: 3-8 categories, same unit of measurement

2b. GROUPED BAR CHARTS - Use for comparing paired values:
   - ✅ PERFECT for: "Current vs Suggested rates by route", "Actual vs Target by carrier"
   - Data format: [{"name": "Route A", "current": 1200, "suggested": 1350}, ...]
   - Requirements: 2-6 items with meaningful current/suggested pairs

3. LINE CHARTS - Use for trends over time only:
   - ✅ GOOD: "Booking rates over the last 30 days", "Average margin trends by month"
   - ❌ BAD: Any non-time-based data
   - Requirements: Time-based X-axis, continuous data

4. PIE CHARTS - Use for parts of a whole (percentages):
   - ✅ GOOD: "Call outcomes distribution", "Load status breakdown", "Sentiment distribution"
   - ❌ BAD: Any data that doesn't sum to 100% or represent parts of a whole
   - Requirements: 2-6 categories that sum to a meaningful total

5. BETTER ALTERNATIVES:
   - For "Current vs Suggested rates": Use grouped-bar chart with route/carrier groupings
   - Instead of individual load comparisons: Aggregate by route, carrier, or urgency level
   - Instead of mixing incomparable data: Group similar items and show patterns

6. CHART CREATION RULES:
   - Only create charts when they reveal patterns or trends
   - Ensure all data points use the same unit/scale
   - Group individual items into meaningful categories
   - Never create a chart with mixed/incomparable items
   - When in doubt, use text analysis instead`
            }
          ];

          // Add conversation history if provided
          if (conversationHistory && Array.isArray(conversationHistory)) {
            messages.push(...conversationHistory);
          }

          // Add current user message
          messages.push({
            role: "user",
            content: `Question: ${message}`
          });

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1000
          });

          const content = completion.choices[0]?.message?.content || '{}';
          let result;

          try {
            result = JSON.parse(content);
          } catch (parseError) {
            console.error('Failed to parse OpenAI response:', parseError);
            throw new Error('Invalid JSON response from OpenAI');
          }

          return NextResponse.json(result);
        } catch (apiError: any) {
          console.error('OpenAI Chat API Error:', apiError);

          // Return fallback response
          return NextResponse.json({
            response: 'I\'m currently unable to process your question due to API limitations. Please try again later or check your dashboard data directly.'
          });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Insights API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}