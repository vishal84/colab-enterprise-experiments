import React from 'react';
import { GroupedCitation, SourceInfo } from './GroupedCitation';
import clsx from 'clsx';
import { Bot, User } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sourcesMap?: Record<string, SourceInfo>;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  const renderContent = () => {
    if (isUser || !message.sourcesMap) {
      return <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>;
    }

    // Regex to match consecutive citations: [1], [1][2], [1, 2], [1,2,3]
    const citationRegex = /(\[\d+(?:(?:,\s*|\]\[)\d+)*\])+/g;
    const parts = [];
    let lastIndex = 0;
    
    let match;
    while ((match = citationRegex.exec(message.content)) !== null) {
      // Push text before match
      if (match.index > lastIndex) {
        parts.push(message.content.substring(lastIndex, match.index));
      }

      // Extract all raw numbers from the matched string
      const numbers = match[0].match(/\d+/g);
      if (numbers && numbers.length > 0) {
        parts.push(
          <GroupedCitation 
            key={`cite-${match.index}`} 
            citationIds={numbers} 
            sourcesMap={message.sourcesMap} 
          />
        );
      } else {
        // Fallback
        parts.push(match[0]);
      }
      
      lastIndex = citationRegex.lastIndex;
    }
    
    if (lastIndex < message.content.length) {
      parts.push(message.content.substring(lastIndex));
    }

    return <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{parts}</div>;
  };

  return (
    <div className={clsx("flex gap-4 w-full mb-6", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={clsx(
        "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
        isUser ? "bg-indigo-600 text-white" : "bg-teal-500 text-white shadow-sm"
      )}>
        {isUser ? <User className="w-5 h-5"/> : <Bot className="w-5 h-5"/>}
      </div>
      
      <div className={clsx(
        "max-w-[75%] px-5 py-4 rounded-2xl shadow-sm border",
        isUser ? "bg-indigo-50 border-indigo-100 rounded-tr-none" : "bg-white border-gray-200 rounded-tl-none"
      )}>
        {renderContent()}
      </div>
    </div>
  );
}
