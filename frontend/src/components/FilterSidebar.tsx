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
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 shrink-0 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-6 text-gray-700 font-semibold text-lg">
        <Filter className="w-5 h-5"/>
        <span>Metadata Filters</span>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Asset Type</h3>
        <button 
          onClick={() => setUseChartFilter(!useChartFilter)}
          className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          {useChartFilter ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}
          <span className="text-sm text-gray-700">Charts & Graphs Only</span>
        </button>
        <p className="text-xs text-gray-400 mt-1 pl-2">
           Filters where `type: ANY("chart", "graph")`
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Source File</h3>
        <input 
          type="text"
          placeholder="e.g. report.pdf"
          value={documentFilter}
          onChange={e => setDocumentFilter(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
         <p className="text-xs text-gray-400 mt-1 pl-1">
           Filters where `source_file: ANY("...")`
        </p>
      </div>
    </div>
  );
}
