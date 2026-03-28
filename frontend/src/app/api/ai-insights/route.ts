import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { streamText } from 'ai';

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

          // Build messages array starting with system prompt
          const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            {
              role: "system",
              content: `You are a carrier sales analyst AI. Analyze questions and provide both textual responses AND chart visualizations when appropriate.

CRITICAL: Never use emojis, emoticons, or symbols (like 💡, 📊, 🔍, etc.) anywhere in your response - not in text, chart titles, insights, or data labels. Use plain text only.

IMPORTANT: Respond with JSON in this exact format:
{
  "response": "Your complete textual analysis and insights here. Include ALL analytical commentary, key findings, data interpretations, business insights, and recommendations in this response field.",
  "chart": {
    "type": "bar|line|pie|null",
    "title": "Chart title - keep this simple and descriptive",
    "data": [{"name": "Label", "value": number}, ...]
  },
  "followUpQuestions": ["Question 1", "Question 2", "Question 3"]
}

CRITICAL FORMATTING: Keep responses succinct but use markdown formatting sparingly and strategically:
- Use **bold text** occasionally for key findings or critical metrics
- Use bullet points (- ) or numbered lists (1. ) only when presenting multiple related items
- Don't overformat - most responses should be natural prose with selective emphasis
- Only use lists when you have 2-4 related points to present
- Example: "Your conversion rate of **18.5%** suggests room for improvement. The main issues are pricing accuracy and response times, which directly impact the 40% negative sentiment we're seeing."

CRITICAL CHART GUIDANCE: Only generate charts when they add meaningful value:
- Don't create charts for every response - many questions can be answered with text only
- Generate charts only when visualizing data trends, comparisons, or distributions
- If the user asks a simple question about a single metric, respond with text only
- Use null for chart type when visualization doesn't enhance understanding
- Example questions that don't need charts: "What's our conversion rate?", "How many calls did we get?", "What should we improve?"

CRITICAL: Put ALL analysis, commentary, interpretations, business insights, and recommendations in the "response" field only. Charts are purely visual without separate text insights.

Available data fields:
- total_calls: ${context?.metrics?.total_calls || 0}
- booked_calls: ${context?.metrics?.booked_calls || 0}
- conversion_rate: ${context?.metrics?.conversion_rate || 0}%
- average_negotiation_rounds: ${context?.metrics?.average_negotiation_rounds || 0}
- average_discount_percentage: ${context?.metrics?.average_discount_percentage || 0}%
- failed_negotiations: ${context?.metrics?.failed_negotiations || 0}
- sentiment_distribution: positive=${context?.metrics?.sentiment_distribution?.positive || 0}, neutral=${context?.metrics?.sentiment_distribution?.neutral || 0}, negative=${context?.metrics?.sentiment_distribution?.negative || 0}

IMPORTANT: When asked about trends, historical data, or time-based analysis, you should intelligently generate realistic time-series data based on the current metrics. For example:
- Create weekly or daily breakdowns for the past month
- Show realistic variations around the current values
- Generate data that tells a coherent story about business performance
- Use current conversion rate as a baseline and create realistic fluctuations

Example: If current conversion rate is 20%, create a 4-week trend like:
Week 1: 18.5%, Week 2: 19.2%, Week 3: 21.1%, Week 4: 20.0%

Chart guidelines:
- Use "bar" for comparisons, categories, distributions
- Use "line" for trends over time (create time-based data when relevant)
- Use "pie" for proportions and percentages
- Use null for chart when no visualization is needed
- Always include 3-5 data points in charts
- Make data labels clear and concise
- Do not use emojis in chart titles, data labels, or insights

EXAMPLE:
"response": "From the data shown in the chart, most calls are neutral, indicating significant potential to shift these towards positive with improved communication strategies. The high negative sentiment directly impacts conversion rates and should be addressed through better initial pricing and response times."`
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