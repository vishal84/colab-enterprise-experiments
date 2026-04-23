import React, { useState, useEffect } from 'react';
import { Database, Hash, Image, MapPin, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SourceInfo {
  referenceId: string;
  sourceText?: string;
  blobAttachments?: { name: string; content: string; mimeType: string }[];
  structData?: Record<string, any>;
}

function SourceModal({ validSources, onClose }: { validSources: SourceInfo[], onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[720px] max-w-[90vw] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="text-base font-bold text-gray-800">
            Grounded Context — {validSources.length} {validSources.length > 1 ? 'Sources' : 'Source'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sources */}
        <div className="px-6 py-4 space-y-5">
          {validSources.map((source, idx) => (
            <div key={idx} className="pb-5 border-b border-gray-100 last:border-0 last:pb-0">
              {/* Source header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 shrink-0">
                  <Hash className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">Source [{source.referenceId}]</span>
              </div>
              
              {/* Source file and page info from structData */}
              {source.structData && (source.structData.source || source.structData.source_file) && (
                <div className="flex items-center gap-1.5 mb-3 ml-8 text-xs text-blue-700 bg-blue-50 w-fit px-2.5 py-1 rounded-md border border-blue-100">
                  <Database className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {source.structData.source || source.structData.source_file}
                    {(source.structData.page_number || source.structData.page) && 
                      ` — Page ${source.structData.page_number || source.structData.page}`}
                  </span>
                </div>
              )}

              {/* Source text */}
              {source.sourceText && (
                <div className="ml-8 mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Excerpt</p>
                  <p className="text-sm text-gray-600 italic bg-gray-50 border-l-3 border-gray-300 pl-3 py-2 leading-relaxed rounded-r">
                    &quot;{source.sourceText.substring(0, 600)}{source.sourceText.length > 600 ? '...' : ''}&quot;
                  </p>
                </div>
              )}

              {/* Render BYOC inline images if matched (original blob approach) */}
              {source.blobAttachments && source.blobAttachments.map((blob, bIdx) => (
                <div key={bIdx} className="ml-8 mt-3">
                  <p className="text-xs text-indigo-600 font-semibold mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5"/> Referenced Visual (Chart/Graph)
                  </p>
                  <img 
                    src={`data:${blob.mimeType};base64,${blob.content}`} 
                    alt="Chunk Visualization" 
                    className="rounded-lg border border-gray-200 w-full h-auto max-h-[400px] object-contain bg-gray-50 shadow-sm"
                  />
                </div>
              ))}

              {/* Render exhibit images from GCS (structData workaround) */}
              {!source.blobAttachments?.length && source.structData?.image_gcs_path && (
                <div className="ml-8 mt-3">
                  <p className="text-xs text-indigo-600 font-semibold mb-2 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5"/> Exhibit Visual
                  </p>
                  <img 
                    src={`/api/image?path=${encodeURIComponent(source.structData.image_gcs_path)}`} 
                    alt={source.structData.title || "Exhibit image"} 
                    className="rounded-lg border border-gray-200 w-full h-auto max-h-[400px] object-contain bg-gray-50 shadow-sm"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
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
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors border border-blue-200/60 mx-0.5 align-baseline"
      >
        {label}
      </button>

      {isOpen && (
        <SourceModal 
          validSources={validSources} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
