import React from 'react';
import { GroupedCitation, SourceInfo } from './GroupedCitation';
import clsx from 'clsx';
import { Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sourcesMap?: Record<string, SourceInfo>;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  const renderContent = () => {
    if (isUser || !message.sourcesMap) {
      return <p className="text-gray-800 whitespace-pre-wrap text-sm">{message.content}</p>;
    }

    // Regex to match consecutive citations: [1], [1][2], [1, 2], [1,2,3]
    const citationRegex = /(\[\d+(?:(?:,\s*|\]\[)\d+)*\])+/g;

    // Split the content into paragraphs first, then process citations within each
    const paragraphs = message.content.split(/\n\n+/);

    return (
      <div className="text-gray-800 text-sm leading-relaxed space-y-4">
        {paragraphs.map((para, pIdx) => {
          // Check if this paragraph looks like a heading (bold markers ** or short standalone line)
          const headingMatch = para.match(/^\*\*(.*?)\*\*$/);
          if (headingMatch) {
            return (
              <h3 key={pIdx} className="text-base font-bold text-[#1a2332] mt-2">
                {headingMatch[1]}
              </h3>
            );
          }

          // Process inline citations within the paragraph
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match;
          
          // Reset regex state
          citationRegex.lastIndex = 0;

          while ((match = citationRegex.exec(para)) !== null) {
            // Push text before match
            if (match.index > lastIndex) {
              parts.push(renderTextWithHeadings(para.substring(lastIndex, match.index), `${pIdx}-t-${lastIndex}`));
            }

            // Extract all raw numbers from the matched string
            const numbers = match[0].match(/\d+/g);
            if (numbers && numbers.length > 0) {
              parts.push(
                <GroupedCitation 
                  key={`cite-${pIdx}-${match.index}`} 
                  citationIds={numbers} 
                  sourcesMap={message.sourcesMap!} 
                />
              );
            } else {
              parts.push(match[0]);
            }
            
            lastIndex = citationRegex.lastIndex;
          }
          
          if (lastIndex < para.length) {
            parts.push(renderTextWithHeadings(para.substring(lastIndex), `${pIdx}-t-${lastIndex}`));
          }

          return <div key={pIdx} className="leading-relaxed">{parts}</div>;
        })}
      </div>
    );
  };

  // Render text, converting **bold** markers to <strong> elements
  const renderTextWithHeadings = (text: string, keyPrefix: string): React.ReactNode => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let m;

    while ((m = boldRegex.exec(text)) !== null) {
      if (m.index > lastIdx) {
        parts.push(text.substring(lastIdx, m.index));
      }
      parts.push(<strong key={`${keyPrefix}-b-${m.index}`} className="font-bold text-[#1a2332]">{m[1]}</strong>);
      lastIdx = boldRegex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="border border-gray-300 rounded-lg px-5 py-3 max-w-xl bg-white">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex items-start justify-center w-9 h-9 rounded-full shrink-0 bg-[#4a9b8f] text-white mt-0.5">
        <Bot className="w-4 h-4 mt-2.5"/>
      </div>
      
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  );
}
