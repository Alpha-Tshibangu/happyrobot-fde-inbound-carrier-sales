'use client';

import React from 'react';
import { AIChatInterface } from './ai-chat-interface';
import { type CallStats } from '@/lib/api-service';
import { cn } from '@/lib/utils';

interface AIAssistantInlinePanelProps {
  isOpen: boolean;
  metrics: CallStats | null;
}

export function AIAssistantInlinePanel({ isOpen, metrics }: AIAssistantInlinePanelProps) {
  return (
    <div
      className={cn(
        "h-screen overflow-hidden flex transition-all duration-300 ease-in-out",
        isOpen ? "py-4 pr-4" : "p-0"
      )}
    >
      <div
        className={cn(
          "h-full bg-background border rounded-xl shadow-lg flex flex-col overflow-hidden min-w-0 transition-all duration-300",
          isOpen
            ? "ease-out w-[380px] xl:w-[420px] opacity-100 translate-x-0 pointer-events-auto"
            : "ease-in w-0 opacity-0 translate-x-4 pointer-events-none border-transparent"
        )}
        style={{ willChange: 'width, transform, opacity' }}
      >
        <div className="flex-1 overflow-hidden">
          {metrics ? <AIChatInterface metrics={metrics} /> : null}
        </div>
      </div>
    </div>
  );
}