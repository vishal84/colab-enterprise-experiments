"use client";

import { useState } from 'react';
import { FilterSidebar } from '@/components/FilterSidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { Send, Loader2, SearchIcon } from 'lucide-react';
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
      
      const rawText = answerBlock.answerText || "I couldn't find an answer to that.";
      const citations = answerBlock.citations || [];
      const references = answerBlock.references || [];
      
      // Build sourcesMap from the references array (which has chunkInfo with content & blobs)
      const sourcesMap: Record<string, SourceInfo> = {};

      references.forEach((ref: any, idx: number) => {
          const id = String(idx);
          const chunk = ref.chunkInfo;
          // structData is inside chunkInfo.documentMetadata.structData
          const docMeta = chunk?.documentMetadata;
          sourcesMap[id] = {
              referenceId: id,
              sourceText: chunk?.content,
              blobAttachments: chunk?.blobAttachments,
              structData: docMeta?.structData || ref.structData || chunk?.structData
          };
      });

      // Also merge any source-level data from citations themselves
      citations.forEach((c: any) => {
          c.sources?.forEach((s: any) => {
              if (s.referenceId && !sourcesMap[s.referenceId]) {
                 sourcesMap[s.referenceId] = {
                     referenceId: s.referenceId,
                     sourceText: s.chunkInfo?.content,
                     blobAttachments: s.chunkInfo?.blobAttachments,
                     structData: s.structData || s.chunkInfo?.structData
                 };
              }
          });
      });

      // Inject inline [N] citation markers into the text at the correct positions.
      // The Answer API provides citations as {startIndex, endIndex, sources:[{referenceId}]}
      // We insert markers at each endIndex position, working backwards to preserve offsets.
      interface CitationInsert {
        position: number;
        marker: string;
      }

      const inserts: CitationInsert[] = [];
      citations.forEach((c: any) => {
          const endIdx = c.endIndex ?? rawText.length;
          const refIds = (c.sources || []).map((s: any) => s.referenceId).filter(Boolean);
          if (refIds.length > 0) {
            // Build marker like [1] or [1][2] for multiple sources
            const marker = refIds.map((id: string) => `[${id}]`).join('');
            inserts.push({ position: endIdx, marker });
          }
      });

      // Sort by position descending so earlier inserts don't shift later positions
      inserts.sort((a, b) => b.position - a.position);

      let annotatedText = rawText;
      for (const ins of inserts) {
        annotatedText = annotatedText.slice(0, ins.position) + ins.marker + annotatedText.slice(ins.position);
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: annotatedText,
        sourcesMap
      }]);

    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans text-gray-900">
      
      {/* Full-width Header */}
      <header className="shrink-0 bg-white px-8 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-[#1a2332] tracking-tight">
          Cymbal Enterprise Search
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enterprise AI Search for Consulting Services
        </p>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar for Filters */}
        <FilterSidebar 
          useChartFilter={useChartFilter}
          setUseChartFilter={setUseChartFilter}
          documentFilter={documentFilter}
          setDocumentFilter={setDocumentFilter}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative h-full bg-white">
          
          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto px-8 py-6 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                 <SearchIcon className="w-12 h-12 text-gray-300 mb-2" />
                 <h2 className="text-lg font-semibold text-gray-500">Ask me anything about your documents</h2>
                 <p className="text-sm text-gray-400">Filter using the sidebar, then type a question below.</p>
              </div>
            ) : (
              <div className="max-w-4xl">
                {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
                
                {isLoading && (
                   <div className="flex items-center gap-3 text-gray-500 py-4 font-medium animate-pulse">
                     <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> Searching...
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-8 pb-4 pt-3 bg-white border-t border-gray-100 shrink-0">
             <div className="max-w-4xl relative flex items-center">
               <input 
                 type="text"
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSend()}
                 placeholder="Ask a question about your processed data..."
                 className="w-full bg-white border border-gray-300 rounded-lg pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400"
               />
               <button 
                 onClick={handleSend}
                 disabled={isLoading || !input.trim()}
                 className="absolute right-3 p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
               >
                 <Send className="w-5 h-5"/>
               </button>
             </div>
             <div className="text-center mt-2">
               <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">Cymbal AI Search • Gemini Grounding • BYOC Image Support</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
