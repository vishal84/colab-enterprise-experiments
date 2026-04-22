"use client";

import { useState } from 'react';
import { FilterSidebar } from '@/components/FilterSidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { Send, Loader2 } from 'lucide-react';
import { SourceInfo } from '@/components/GroupedCitation';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sourcesMap?: Record<string, SourceInfo>;
}

export default function SearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter States
  const [useChartFilter, setUseChartFilter] = useState(false);
  const [documentFilter, setDocumentFilter] = useState("");

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Build CEL filter Expression
    const filterParts = [];
    if (useChartFilter) {
      filterParts.push(`type: ANY("chart", "graph")`);
    }
    if (documentFilter.trim()) {
      filterParts.push(`source_file: ANY("${documentFilter.trim()}")`);
    }
    const filterExpr = filterParts.length > 0 ? filterParts.join(" AND ") : undefined;

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage, filter: filterExpr })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response.");
      }

      // Parse citations directly from the answer block
      const answerBlock = data.answer;
      if (!answerBlock) throw new Error("No answer returned from Discovery Engine.");
      
      const text = answerBlock.answerText || "I couldn't find an answer to that.";
      const citations = answerBlock.citations || [];
      
      const sourcesMap: Record<string, SourceInfo> = {};

      citations.forEach((c: any) => {
          c.sources?.forEach((s: any) => {
              if (s.referenceId) {
                 sourcesMap[s.referenceId] = {
                     referenceId: s.referenceId,
                     sourceText: s.chunkInfo?.content,
                     blobAttachments: s.chunkInfo?.blobAttachments,
                     structData: s.structData || s.chunkInfo?.structData
                 };
              }
          });
      });

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: text,
        sourcesMap
      }]);

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans text-gray-900">
      {/* Sidebar for Filters */}
      <FilterSidebar 
        useChartFilter={useChartFilter}
        setUseChartFilter={setUseChartFilter}
        documentFilter={documentFilter}
        setDocumentFilter={setDocumentFilter}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full bg-slate-50">
        
        {/* Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              Vertex AI Enterprise Search
            </h1>
            <span className="text-xs text-gray-500">Grounded BYOC Analytics</span>
          </div>
        </header>

        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
               <div className="text-6xl mb-4">👋</div>
               <h2 className="text-xl font-bold">Ask me anything about your documents</h2>
               <p className="text-sm">Filter using the sidebar, then type a question below.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
              
              {isLoading && (
                 <div className="flex items-center gap-3 text-gray-500 p-4 mb-4 font-medium animate-pulse">
                   <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> Thinking...
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
           <div className="max-w-4xl mx-auto relative flex items-center shadow-sm">
             <input 
               type="text"
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Ask a question about your processed data..."
               className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all transition-shadow"
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !input.trim()}
               className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
             >
               <Send className="w-4 h-4"/>
             </button>
           </div>
           <div className="text-center mt-2">
             <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Vertex AI Search • Gemini Grounding • BYOC Image Support</span>
           </div>
        </div>

      </div>
    </div>
  );
}
