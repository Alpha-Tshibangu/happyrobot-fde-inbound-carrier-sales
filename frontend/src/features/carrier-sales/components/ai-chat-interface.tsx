'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingUp,
  IconPhone,
  IconArrowUp,
  IconMoodSmile,
} from '@tabler/icons-react';
import { aiInsightsService, type ConversationalResponse } from '@/lib/ai-insights-service';
import type { CallStats } from '@/lib/api-service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  followUpQuestions?: string[];
  chart?: {
    type: 'bar' | 'line' | 'pie' | null;
    title: string;
    data: Array<{name: string; value: number}>;
    insights?: string[];
  } | null;
}

interface AIChatInterfaceProps {
  metrics: CallStats;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border rounded-lg p-2 shadow-sm">
        <p className="text-sm font-medium">{label || data.payload.name}</p>
        <p className="text-sm text-muted-foreground">
          {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </p>
      </div>
    );
  }
  return null;
};

export function AIChatInterface({ metrics }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ai-chat-messages');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ai-chat-started');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ai-chat-messages', JSON.stringify(messages));
      sessionStorage.setItem('ai-chat-started', JSON.stringify(hasStarted));
    }
  }, [messages, hasStarted]);

  // Removed hardcoded chart generation - now handled by AI

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!hasStarted) setHasStarted(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Build conversation history from existing messages
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response: ConversationalResponse = await aiInsightsService.analyzeConversation(
        currentInput,
        metrics,
        conversationHistory
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        followUpQuestions: response.followUpQuestions,
        chart: response.chart,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  const handleClearConversation = () => {
    setMessages([]);
    setHasStarted(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ai-chat-messages');
      sessionStorage.removeItem('ai-chat-started');
    }
  };


  if (!hasStarted) {
    return (
      <div className="min-h-[600px] flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center text-center py-16">
          <div className="mb-6 h-6">
            {/* Spacer to maintain layout positioning */}
          </div>
        </div>

        {/* Input Section */}
        <div className="px-8 pb-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-tobias">What insights would you like to explore?</h1>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your carrier sales data..."
                  disabled={loading}
                  className="h-16 pl-6 pr-20 text-lg rounded-full border focus:border-primary/10 focus:ring-0 focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full p-0"
                >
                  <IconArrowUp className="h-10 w-10" />
                </Button>
              </div>
            </form>

            {/* Section Title */}
            <div className="mt-32">
              <h3 className="text-lg font-semibold text-muted-foreground">Try these analytics prompts</h3>
            </div>

            {/* Suggested Prompts - Individual Components with Background */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Conversion Trends Card */}
              <div
                className="relative rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat cursor-pointer"
                style={{ backgroundImage: 'url(https://img.freepik.com/premium-photo/dark-blue-orange-white-grainy-gradient-background-abstract-colors-noise-texture-backdrop-wide-banner-poster-header-cover-design_284753-2738.jpg)' }}
                onClick={() => setInput("Show me our conversion rate trend over the past month")}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors relative z-10 h-full">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconTrendingUp className="size-4" />
                      Conversion Trends
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {(metrics.conversion_rate).toFixed(1)}%
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant={metrics.conversion_rate > 20 ? 'default' : 'secondary'} className="bg-white/20 text-white border-white/30">
                        {metrics.conversion_rate > 20 ? 'Good' : 'Below Target'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Booked: {metrics.booked_calls} calls
                    </div>
                    <div className="text-white/80 text-sm">
                      "Show me our conversion rate trend over the past month"
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Call Volume Card */}
              <div
                className="relative rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat cursor-pointer"
                style={{ backgroundImage: 'url(https://img.freepik.com/premium-photo/dark-blue-orange-white-grainy-gradient-background-abstract-colors-noise-texture-backdrop-wide-banner-poster-header-cover-design_284753-2738.jpg)' }}
                onClick={() => setInput("Analyze call volume patterns and peak times")}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors relative z-10 h-full">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconPhone className="size-4" />
                      Call Volume
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {metrics.total_calls.toLocaleString()}
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <IconTrendingUp className="size-3" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Daily: {Math.round(metrics.total_calls / 30)}
                    </div>
                    <div className="text-white/80 text-sm">
                      "Analyze call volume patterns and peak times"
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Performance Card */}
              <div
                className="relative rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat cursor-pointer"
                style={{ backgroundImage: 'url(https://img.freepik.com/premium-photo/dark-blue-orange-white-grainy-gradient-background-abstract-colors-noise-texture-backdrop-wide-banner-poster-header-cover-design_284753-2738.jpg)' }}
                onClick={() => setInput("Break down performance metrics and identify improvement opportunities")}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors relative z-10 h-full">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconMoodSmile className="size-4" />
                      Performance
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {((metrics.sentiment_distribution.positive / metrics.total_calls) * 100).toFixed(1)}%
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {metrics.sentiment_distribution.positive} calls
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Negative: {metrics.sentiment_distribution.negative}
                    </div>
                    <div className="text-white/80 text-sm">
                      "Break down performance metrics and identify improvement opportunities"
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Operational Questions Section */}
            <div className="mt-16">
              <h3 className="text-lg font-semibold text-muted-foreground mb-4">Explore these operational insights</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("What are our busiest call times during the week?")}
                >
                  <p className="text-base text-card-foreground">What are our busiest call times during the week?</p>
                </div>
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("Which carriers have the highest success rates?")}
                >
                  <p className="text-base text-card-foreground">Which carriers have the highest success rates?</p>
                </div>
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("How does our pricing affect negotiation outcomes?")}
                >
                  <p className="text-base text-card-foreground">How does our pricing affect negotiation outcomes?</p>
                </div>
              </div>
            </div>

            {/* Strategic Questions Section */}
            <div className="mt-16">
              <h3 className="text-lg font-semibold text-muted-foreground mb-4">Ask these strategic questions</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("What seasonal trends should we prepare for?")}
                >
                  <p className="text-base text-card-foreground">What seasonal trends should we prepare for?</p>
                </div>
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("How can we expand into new carrier markets?")}
                >
                  <p className="text-base text-card-foreground">How can we expand into new carrier markets?</p>
                </div>
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("What competitive advantages can we develop?")}
                >
                  <p className="text-base text-card-foreground">What competitive advantages can we develop?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] flex flex-col relative">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-6" style={{fontFamily: 'Segoe UI, system-ui, sans-serif'}}>
          {messages.map((message, index) => (
            <div key={message.id}>
              {message.role === 'assistant' ? (
                <div className="space-y-3">
                  {/* AI response - centered container with left-aligned text */}
                  <div className="max-w-3xl mx-auto">
                    <div className="text-base leading-relaxed text-white text-left">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                        components={{
                          p: ({ children }) => <p className="mb-4 last:mb-0 text-white">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-white pl-2">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-white">{children}</em>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-white">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 text-white">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-medium mb-2 text-white">{children}</h3>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  {/* User message - right aligned with grey background */}
                  <div className="max-w-[85%]">
                    <div className="bg-muted text-white px-4 py-3 rounded-2xl rounded-br-none">
                      <div className="text-base leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-white">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-6 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-6 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-white pl-2">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-white">{children}</em>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-white">{children}</h3>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="space-y-3 mt-7">

                  {/* Chart Display */}
                  {message.chart && message.chart.type && message.chart.data && message.chart.data.length > 0 && (
                    <Card className="p-4">
                      <div className="mb-3 text-center">
                        <h4 className="text-sm font-medium text-white">{message.chart.title}</h4>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          {message.chart.type === 'bar' ? (
                            <BarChart
                              data={message.chart.data}
                              onMouseMove={(data) => {
                                if (data && data.activeTooltipIndex !== undefined) {
                                  setHoveredBarIndex(data.activeTooltipIndex);
                                }
                              }}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                            >
                              <XAxis dataKey="name" tick={{ fill: 'white' }} />
                              <YAxis tick={{ fill: 'white' }} />
                              <Tooltip content={<CustomTooltip />} cursor={false} />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {message.chart.data.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={hoveredBarIndex === index
                                      ? `hsl(220, 70%, ${Math.max(30, 50 - index * 5)}%)`
                                      : `hsl(220, 70%, ${50 + index * 10}%)`
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          ) : message.chart.type === 'line' ? (
                            <LineChart data={message.chart.data}>
                              <XAxis dataKey="name" tick={{ fill: 'white' }} />
                              <YAxis tick={{ fill: 'white' }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="value" stroke="hsl(220, 70%, 50%)" strokeWidth={2} />
                            </LineChart>
                          ) : message.chart.type === 'pie' ? (
                            <PieChart>
                              <Pie
                                data={message.chart.data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                stroke="none"
                                label={({name, value}) => `${name}: ${value}`}
                              >
                                {message.chart.data.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={`hsl(220, 70%, ${50 + index * 10}%)`}
                                    stroke="none"
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              Chart data unavailable
                            </div>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* Follow-up Questions - Only show for the latest assistant message */}
                  {message.followUpQuestions && index === messages.length - 1 && (
                    <div className="max-w-3xl mx-auto mt-8">
                      <div className="mb-4">
                        <hr className="border-muted-foreground/20 w-full" style={{borderWidth: '0.25px'}} />
                      </div>
                      <div>
                        <p className="text-xs mb-3 text-left text-muted-foreground">Suggested follow-ups</p>
                        <div className="space-y-1">
                          {message.followUpQuestions.map((question, idx) => (
                            <button
                              key={idx}
                              className="flex items-start gap-2 w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                              onClick={() => handleFollowUp(question)}
                            >
                              <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                              <span>{question}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <div className="inline-flex gap-1">
                <div className="h-2 w-2 rounded-full bg-white animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-white animate-bounce delay-100" />
                <div className="h-2 w-2 rounded-full bg-white animate-bounce delay-200" />
              </div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              <p>Start a conversation to get AI insights about your carrier sales data.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>


      {/* Input Section - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Clear conversation button - only visible when messages exist */}
          {messages.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleClearConversation}
                className="text-muted-foreground/50 hover:text-muted-foreground text-sm transition-colors cursor-pointer"
              >
                Clear conversation
              </button>
            </div>
          )}

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your carrier sales data..."
              className="h-16 pl-6 pr-20 text-lg rounded-full border focus:border-primary/10 focus:ring-0 focus:outline-none"
              style={{fontFamily: 'Segoe UI, system-ui, sans-serif'}}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0"
            >
              <IconArrowUp className="h-6 w-6" />
            </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
