import type { CallStats, DashboardSummary } from './api-service';

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'summary';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: string;
  value?: string | number;
  actionable?: boolean;
  timestamp: Date;
}

export interface ConversationalResponse {
  message: string;
  insights?: AIInsight[];
  chart?: {
    type: 'bar' | 'line' | 'pie' | null;
    title: string;
    data: Array<{name: string; value: number}>;
    insights?: string[];
  } | null;
  followUpQuestions?: string[];
}

class AIInsightsService {
  private async callAIAPI(action: string, data: any) {
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        console.error(`API call failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI API Error:', error);
      throw error;
    }
  }

  async generateDailyInsights(
    metrics: CallStats,
    summary: DashboardSummary
  ): Promise<AIInsight[]> {
    try {
      const { insights } = await this.callAIAPI('generateInsights', {
        metrics,
        summary,
      });

      if (!insights) {
        console.log('No insights returned from API, returning empty array');
        return [];
      }

      return Object.entries(insights).flatMap(([category, items]: [string, any]) => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any, index: number) => ({
          id: `insight-${Date.now()}-${category}-${index}`,
          type: category as AIInsight['type'],
          priority: item.priority || 'medium',
          title: item.title,
          description: item.description,
          metric: item.metric,
          value: item.value,
          actionable: item.actionable !== false,
          timestamp: new Date(),
        }));
      });
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [];
    }
  }

  async analyzeConversation(
    question: string,
    metrics: CallStats,
    conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>,
    context?: any
  ): Promise<ConversationalResponse> {
    try {
      const result = await this.callAIAPI('chat', {
        message: question,
        context: { metrics, ...context },
        conversationHistory
      });

      return {
        message: result.response || 'I apologize, but I was unable to generate a response. Please try rephrasing your question.',
        chart: result.chart?.type ? result.chart : null,
        followUpQuestions: result.followUpQuestions || [
          'What caused the recent conversion rate change?',
          'Which carriers are most profitable?',
          'How can we improve negotiation success?',
        ],
      };
    } catch (error) {
      console.error('Error in conversational analysis:', error);
      throw error; // Throw error instead of returning fallback
    }
  }


  async detectAnomalies(
    metrics: CallStats,
    summary: DashboardSummary
  ): Promise<AIInsight[]> {
    return this.generateDailyInsights(metrics, summary);
  }

  async generatePredictions(
    metrics: CallStats,
    summary: DashboardSummary
  ): Promise<AIInsight[]> {
    return this.generateDailyInsights(metrics, summary);
  }

  async generateRecommendations(
    metrics: CallStats,
    summary: DashboardSummary
  ): Promise<AIInsight[]> {
    return this.generateDailyInsights(metrics, summary);
  }
}

export const aiInsightsService = new AIInsightsService();