import React, { useState } from 'react';
import { Database, Hash, Image, MapPin } from 'lucide-react';

export interface SourceInfo {
  referenceId: string;
  sourceText?: string;
  blobAttachments?: { name: string; content: string; mimeType: string }[];
  structData?: Record<string, any>;
}

export function GroupedCitation({ citationIds, sourcesMap }: { citationIds: string[], sourcesMap: Record<string, SourceInfo> }) {
  const [isOpen, setIsOpen] = useState(false);

  // Collect the valid sources for these IDs
  const validSources = citationIds.map(id => sourcesMap[id]).filter(Boolean);

  if (validSources.length === 0) {
     return <span className="text-gray-400 text-[11px] mx-0.5">[{citationIds.join(',')}]</span>;
  }

  const label = citationIds.length > 1 
    ? `[${citationIds.length} sources]` 
    : `[1 source]`;

  return (
    <span 
      className="relative inline-block mx-0.5 align-baseline"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors border border-blue-200/60"
      >
        {label}
      </button>

      {isOpen && (
        <>
          {/* Invisible bridge to prevent mouseLeave when crossing the gap */}
          <div className="absolute bottom-full left-0 w-full h-3" />
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <h4 className="text-xs font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Grounded Context</h4>
            {validSources.map((source, idx) => (
              <div key={idx} className="mb-3 last:mb-0">
                 <div className="flex items-start gap-2 mb-1">
                   <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                   <span className="text-[11px] font-semibold text-gray-600">Source [{source.referenceId}]</span>
                 </div>
                 
                 {/* Source file and page info from structData */}
                 {source.structData && (source.structData.source || source.structData.source_file) && (
                   <div className="flex items-center gap-1 mb-1.5 ml-5 text-[11px] text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded">
                     <Database className="w-3 h-3" />
                     {source.structData.source || source.structData.source_file}
                     {(source.structData.page_number || source.structData.page) && 
                       ` (Page ${source.structData.page_number || source.structData.page})`}
                   </div>
                 )}

                 {source.sourceText && (
                    <p className="text-[11px] text-gray-500 ml-5 italic bg-gray-50 border-l-2 border-gray-200 pl-2 py-1 leading-relaxed">
                      &quot;{source.sourceText.substring(0, 300)}{source.sourceText.length > 300 ? '...' : ''}&quot;
                    </p>
                 )}

                 {/* Render BYOC inline images if matched (original blob approach) */}
                 {source.blobAttachments && source.blobAttachments.map((blob, bIdx) => (
                     <div key={bIdx} className="mt-2 ml-5">
                        <p className="text-[11px] text-indigo-500 font-semibold mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3"/> Referenced Visual (Chart/Graph)
                        </p>
                        <img 
                          src={`data:${blob.mimeType};base64,${blob.content}`} 
                          alt="Chunk Visualization" 
                          className="rounded border border-gray-200 w-full h-auto max-h-48 object-contain bg-gray-50"
                        />
                     </div>
                 ))}

                 {/* Render exhibit images from GCS (structData workaround) */}
                 {!source.blobAttachments?.length && source.structData?.image_gcs_path && (
                     <div className="mt-2 ml-5">
                        <p className="text-[11px] text-indigo-500 font-semibold mb-1 flex items-center gap-1">
                          <Image className="w-3 h-3"/> Exhibit Visual
                        </p>
                        <img 
                          src={`/api/image?path=${encodeURIComponent(source.structData.image_gcs_path)}`} 
                          alt={source.structData.title || "Exhibit image"} 
                          className="rounded border border-gray-200 w-full h-auto max-h-48 object-contain bg-gray-50"
                          loading="lazy"
                        />
                     </div>
                 )}
              </div>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
