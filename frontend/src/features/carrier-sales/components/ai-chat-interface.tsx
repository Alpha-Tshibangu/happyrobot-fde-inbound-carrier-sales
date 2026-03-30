'use client';

import { useLayoutEffect, useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconArrowUp,
} from '@tabler/icons-react';
import { aiInsightsService, type ConversationalResponse } from '@/lib/ai-insights-service';
import type { CallStats } from '@/lib/api-service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
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
    type: 'bar' | 'grouped-bar' | 'line' | 'pie' | null;
    title: string;
    data: Array<{name: string; value: number; current?: number; suggested?: number}>;
    insights?: string[];
  } | null;
}

interface AIChatInterfaceProps {
  metrics: CallStats;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const formatCompactNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    if (value % 1 !== 0) return value.toFixed(2);
    return value.toLocaleString();
  };

  const isMoneySeries = (name: string) =>
    /(rate|margin|price|cost|revenue|usd|\$)/i.test(name);

  const shouldFormatAsCurrency = payload.some((p: any) => {
    const key = String(p?.name ?? p?.dataKey ?? '');
    return isMoneySeries(key);
  });

  const formatValue = (value: unknown) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return String(value ?? '');
    const formatted = formatCompactNumber(value);
    return shouldFormatAsCurrency ? `$${formatted}` : formatted;
  };

  return (
    <div className="bg-background border rounded-lg p-2 shadow-sm">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1 space-y-1">
        {payload
          .filter((p: any) => typeof p?.value === 'number')
          .map((p: any) => (
            <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-6">
              <span className="text-sm text-muted-foreground">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: p.color ?? 'currentColor' }}
                />
                {p.name ?? p.dataKey}
              </span>
              <span className="text-sm font-medium">{formatValue(p.value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

const GroupedBarLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: 26,
        alignItems: 'center',
        whiteSpace: 'nowrap',
        color: 'white',
        fontSize: 12,
        paddingTop: 4,
        paddingBottom: 14,
      }}
    >
      {payload.map((entry: any) => (
        <div key={entry.dataKey ?? entry.value ?? entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: entry.color ?? 'currentColor',
              display: 'inline-block',
            }}
          />
          <span>{entry.value ?? entry.name ?? entry.dataKey}</span>
        </div>
      ))}
    </div>
  );
};

const formatAxisValue = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else if (value % 1 !== 0) {
    return value.toFixed(1);
  }
  return value.toString();
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
  const preChatContainerRef = useRef<HTMLDivElement>(null);
  const preChatHeroRef = useRef<HTMLDivElement>(null);
  const preChatPromptsRef = useRef<HTMLDivElement>(null);
  const [preChatHeroTop, setPreChatHeroTop] = useState<number | null>(null);

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

  // Helper function to validate chart appropriateness
  const validateChart = (chart: any) => {
    if (!chart || !chart.data || chart.data.length < 2) {
      return null;
    }

    // For grouped bar charts, validate paired data structure
    if (chart.type === 'grouped-bar') {
      const hasValidPairs = chart.data.every((item: any) =>
        typeof item.current === 'number' && typeof item.suggested === 'number'
      );
      if (!hasValidPairs) {
        console.warn('Invalid grouped-bar data: missing current/suggested pairs');
        return null;
      }
      return chart;
    }

    // For regular charts, check if all data points have the same unit/type
    const values = chart.data.map((item: any) => item.value);
    const allNumbers = values.every((val: any) => typeof val === 'number');

    if (!allNumbers) {
      return null;
    }

    // Check for nonsensical bar charts (mixed individual items)
    if (chart.type === 'bar' && chart.data.length < 3) {
      return null;
    }

    // Flag suspicious patterns (individual load IDs mixed with rates in regular bar charts)
    const hasLoadIds = chart.data.some((item: any) =>
      item.name && (item.name.includes('LD0') || item.name.includes('Suggested'))
    );

    if (hasLoadIds && chart.type === 'bar') {
      console.warn('Blocking inappropriate chart: individual loads with mixed rate data - should use grouped-bar instead');
      return null;
    }

    return chart;
  };

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

      // Validate and potentially filter out inappropriate charts
      const validatedChart = validateChart(response.chart);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        followUpQuestions: response.followUpQuestions,
        chart: validatedChart,
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
    setInput('');
    setLoading(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ai-chat-messages');
      sessionStorage.removeItem('ai-chat-started');
    }
  };

  // Keep the pre-chat hero centered unless it would collide with the prompts.
  // If space is tight, move the hero up to preserve a minimum gap.
  useLayoutEffect(() => {
    if (hasStarted) {
      setPreChatHeroTop(null);
      return;
    }

    const containerEl = preChatContainerRef.current;
    const heroEl = preChatHeroRef.current;
    const promptsEl = preChatPromptsRef.current;
    if (!containerEl || !heroEl || !promptsEl) return;

    const MIN_GAP_PX = 48;
    const PROMPTS_BOTTOM_PX = 80; // matches `bottom-20`

    const compute = () => {
      const containerH = containerEl.clientHeight;
      const heroH = heroEl.offsetHeight;
      const promptsH = promptsEl.offsetHeight;

      const idealHeroTop = containerH / 2 - heroH / 2;
      const promptsTop = containerH - PROMPTS_BOTTOM_PX - promptsH;
      const maxHeroTop = promptsTop - MIN_GAP_PX - heroH;

      const nextTop = Math.max(0, Math.min(idealHeroTop, maxHeroTop));
      setPreChatHeroTop((prev) => (prev === nextTop ? prev : nextTop));
    };

    compute();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(compute);
    });
    ro.observe(containerEl);
    ro.observe(heroEl);
    ro.observe(promptsEl);

    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [hasStarted]);


  if (!hasStarted) {
    return (
      <div ref={preChatContainerRef} className="h-full relative overflow-hidden">
        {/* Headline + input are centered in the full panel height */}
        <div
          ref={preChatHeroRef}
          className="absolute inset-x-0"
          style={
            preChatHeroTop === null
              ? { top: '50%', transform: 'translateY(-50%)' }
              : { top: `${preChatHeroTop}px` }
          }
        >
          <div className="w-full px-4 sm:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h1 className="text-4xl">What insights would you like to explore?</h1>
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
            </div>
          </div>
        </div>

        {/* Prompts are anchored separately and moved up */}
        <div ref={preChatPromptsRef} className="absolute inset-x-0 bottom-20">
          <div className="w-full px-4 sm:px-8">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-muted-foreground mb-4">
                Try these prompts
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("Why are urgent loads not getting booked?")}
                >
                  <p className="text-base text-card-foreground">Why are urgent loads not getting booked?</p>
                </div>
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("Which loads have the highest margins?")}
                >
                  <p className="text-base text-card-foreground">Which loads have the highest margins?</p>
                </div>
                <div
                  className="rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors p-4 border"
                  onClick={() => setInput("Show me booking patterns for specific routes")}
                >
                  <p className="text-base text-card-foreground">Show me booking patterns for specific routes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-10" style={{fontFamily: 'ui-sans-serif, system-ui, sans-serif'}}>
          {messages.map((message, index) => (
            <div key={message.id}>
              {message.role === 'assistant' ? (
                <div className="space-y-3">
                  {/* AI response - centered container with left-aligned text */}
                  <div className="max-w-3xl mx-auto">
                    <div className="text-sm leading-relaxed text-white text-left">
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
                      <div className="text-sm leading-relaxed">
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
                    <Card className={message.chart.type === 'grouped-bar' ? 'p-3' : 'p-4'}>
                      <div className={message.chart.type === 'grouped-bar' ? 'mb-0 text-center' : 'mb-3 text-center'}>
                        <h4 className="text-sm font-medium text-white">{message.chart.title}</h4>
                      </div>
                      <div className={message.chart.type === 'grouped-bar' ? 'h-96 -mt-2' : 'h-64'}>
                        <ResponsiveContainer width="100%" height="100%">
                          {message.chart.type === 'grouped-bar' ? (
                            <BarChart
                              data={message.chart.data}
                              // Give the legend/ticks enough room so they don't overlap.
                              margin={{ top: 40, right: 50, left: 50, bottom: 44 }}
                              barGap={4}
                              barCategoryGap="20%"
                              onMouseMove={(data) => {
                                if (data && data.activeTooltipIndex !== undefined) {
                                  setHoveredBarIndex(data.activeTooltipIndex);
                                }
                              }}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fill: 'white', fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={72}
                                tickMargin={12}
                              />
                              <YAxis
                                tick={{ fill: 'white', fontSize: 11 }}
                                tickFormatter={formatAxisValue}
                                width={50}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={false} />
                              <Legend
                                layout="horizontal"
                                verticalAlign="top"
                                align="center"
                                content={<GroupedBarLegend />}
                                wrapperStyle={{
                                  // Pull legend slightly upward within the plot area.
                                  transform: 'translateY(-18px)',
                                }}
                              />
                              {/* Use blue shades for both series (no green) */}
                              <Bar
                                dataKey="current"
                                fill="hsl(215, 85%, 58%)"
                                name="Current Rate"
                                radius={[2, 2, 0, 0]}
                                barSize={24}
                              />
                              <Bar
                                dataKey="suggested"
                                fill="hsl(225, 80%, 44%)"
                                name="Suggested Rate"
                                radius={[2, 2, 0, 0]}
                                barSize={24}
                              />
                            </BarChart>
                          ) : message.chart.type === 'bar' ? (
                            <BarChart
                              data={message.chart.data}
                              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                              onMouseMove={(data) => {
                                if (data && data.activeTooltipIndex !== undefined) {
                                  setHoveredBarIndex(data.activeTooltipIndex);
                                }
                              }}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fill: 'white', fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis
                                tick={{ fill: 'white', fontSize: 11 }}
                                tickFormatter={formatAxisValue}
                                width={50}
                              />
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
                            <LineChart
                              data={message.chart.data}
                              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fill: 'white', fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis
                                tick={{ fill: 'white', fontSize: 11 }}
                                tickFormatter={formatAxisValue}
                                width={50}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(220, 70%, 50%)"
                                strokeWidth={2}
                                dot={{ fill: "hsl(220, 70%, 50%)", strokeWidth: 2, r: 4 }}
                              />
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
                                label={({name, value}) => {
                                  const formattedValue = typeof value === 'number' && value >= 1000
                                    ? formatAxisValue(value)
                                    : value;
                                  return `${name}: ${formattedValue}`;
                                }}
                              >
                                {message.chart.data.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={`hsl(220, 70%, ${50 + index * 15}%)`}
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
                    <div className="max-w-3xl mx-auto mt-4">
                      <div>
                        <p className="text-xs mb-2 text-left text-muted-foreground">Suggested follow-ups</p>
                        <div className="space-y-0.5">
                          {message.followUpQuestions.map((question, idx) => (
                            <button
                              key={idx}
                              className="flex items-start gap-2 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
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
      </div>

      {/* Input Section - Fixed at bottom */}
      <div className="shrink-0 bg-background p-2 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-1.5">
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
              className="h-12 sm:h-16 pl-4 sm:pl-6 pr-16 sm:pr-20 text-sm sm:text-base rounded-full border focus:border-primary/10 focus:ring-0 focus:outline-none"
              style={{fontFamily: 'ui-sans-serif, system-ui, sans-serif'}}
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
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
            >
              <IconArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
