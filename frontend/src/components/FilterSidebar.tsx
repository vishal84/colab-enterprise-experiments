"use client";

import { CheckSquare, Square, Filter } from 'lucide-react';

interface FilterSidebarProps {
  useChartFilter: boolean;
  setUseChartFilter: (v: boolean) => void;
  documentFilter: string;
  setDocumentFilter: (v: string) => void;
}

export function FilterSidebar({ useChartFilter, setUseChartFilter, documentFilter, setDocumentFilter }: FilterSidebarProps) {
  return (
    <div className="w-60 bg-[#f8fafc] border-r border-gray-200 px-5 py-5 shrink-0 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-5 text-gray-800 font-semibold text-base">
        <Filter className="w-4 h-4 text-gray-500"/>
        <span>Metadata Filters</span>
      </div>

      <div className="mb-5">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Asset Type</h3>
        <button 
          onClick={() => setUseChartFilter(!useChartFilter)}
          className="flex items-center gap-2.5 w-full text-left py-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          {useChartFilter ? <CheckSquare className="w-4 h-4 text-blue-600"/> : <Square className="w-4 h-4 text-gray-400"/>}
          <span className="text-sm text-gray-700">Charts & Graphs Only</span>
        </button>
        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
           Filters where &apos;type: ANY(&quot;chart&quot;, &quot;graph&quot;)&apos;.
        </p>
      </div>

      <div className="mb-5">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Source File</h3>
        <input 
          type="text"
          placeholder="e.g. report.pdf"
          value={documentFilter}
          onChange={e => setDocumentFilter(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400"
        />
        <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
           Filters where &apos;source_file: ANY(...)&apos; is present.
        </p>
      </div>
    </div>
  );
}
