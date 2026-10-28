import React, { useState } from 'react';
import { DataFrame } from '../types';
import { DataVisualizer } from './DataVisualizer';
import { Search, Download, Check, Copy, ChevronLeft, ChevronRight, Table as TableIcon, BarChart2, Sparkles } from 'lucide-react';

interface DataTableProps {
  data: DataFrame;
  sql?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ data, sql }) => {
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-400 text-sm flex items-center gap-2">
        <TableIcon className="w-4 h-4 text-slate-500" />
        <span>No rows returned from the query.</span>
      </div>
    );
  }

  // Filter rows
  const filteredRows = data.rows.filter((row) =>
    row.some((cell) =>
      cell !== null && cell !== undefined && String(cell).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopySql = () => {
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvHeader = data.columns.join(',') + '\n';
    const csvRows = data.rows
      .map((row) =>
        row
          .map((cell) => {
            if (cell === null || cell === undefined) return '""';
            const str = String(cell).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'query_result.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-3 space-y-2">
      {/* View Switcher Tabs & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center bg-black/80 border border-[#8CFFB7]/30 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'table'
                ? 'bg-[#8CFFB7] text-black shadow-md shadow-[#8CFFB7]/20'
                : 'text-slate-300 hover:text-white hover:bg-[#8CFFB7]/10'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chart'
                ? 'bg-[#8CFFB7] text-black shadow-md shadow-[#8CFFB7]/20'
                : 'text-slate-300 hover:text-white hover:bg-[#8CFFB7]/10'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Visualize & Charts</span>
            <span className="ml-1 text-[10px] bg-emerald-950 text-[#8CFFB7] border border-[#8CFFB7]/40 px-1 py-0.2 rounded font-mono">
              Auto
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {sql && (
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-lg text-slate-300 hover:text-white transition-all"
              title="Copy SQL Query"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#8CFFB7]" /> : <Copy className="w-3.5 h-3.5 text-[#8CFFB7]" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>
          )}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-lg text-slate-300 hover:text-white transition-all"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#8CFFB7]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Render Chart or Table */}
      {activeTab === 'chart' ? (
        <DataVisualizer data={data} onSwitchToTable={() => setActiveTab('table')} />
      ) : (
        <div className="bg-black/90 border border-[#8CFFB7]/30 rounded-xl overflow-hidden text-slate-200 shadow-lg">
          {/* Header search controls */}
          <div className="p-3 bg-black/60 border-b border-[#8CFFB7]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8CFFB7]" />
                <input
                  type="text"
                  placeholder="Search table results..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-1 bg-black/80 border border-[#8CFFB7]/30 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#8CFFB7]"
                />
              </div>
              <span className="text-slate-400">
                Showing {filteredRows.length} of {data.rows.length} rows
              </span>
            </div>

            <button
              onClick={() => setActiveTab('chart')}
              className="flex items-center gap-1 text-[11px] text-[#8CFFB7] hover:underline"
            >
              <Sparkles className="w-3 h-3 text-[#8CFFB7]" />
              <span>Click here to generate charts from this data</span>
            </button>
          </div>

          {/* Table view */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/90 text-[#8CFFB7] font-semibold border-b border-[#8CFFB7]/30 sticky top-0 backdrop-blur-sm">
                  <th className="p-2.5 w-12 text-center border-r border-[#8CFFB7]/20 text-slate-500">#</th>
                  {data.columns.map((col, idx) => (
                    <th key={idx} className="p-2.5 border-r border-[#8CFFB7]/20 font-mono text-[#8CFFB7] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8CFFB7]/10">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={data.columns.length + 1} className="p-6 text-center text-slate-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => {
                    const globalIdx = (currentPage - 1) * pageSize + rIdx + 1;
                    return (
                      <tr key={rIdx} className="hover:bg-[#8CFFB7]/10 transition-colors">
                        <td className="p-2.5 text-center text-slate-500 border-r border-[#8CFFB7]/10 font-mono text-[11px]">
                          {globalIdx}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 border-r border-[#8CFFB7]/10 whitespace-nowrap">
                            {cell === null || cell === undefined ? (
                              <span className="text-slate-600 italic">NULL</span>
                            ) : typeof cell === 'boolean' ? (
                              <span className={cell ? 'text-[#8CFFB7] font-semibold' : 'text-amber-400'}>{String(cell)}</span>
                            ) : (
                              <span>{String(cell)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="p-2.5 bg-black/60 border-t border-[#8CFFB7]/20 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-[#8CFFB7]/10 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4 text-[#8CFFB7]" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-[#8CFFB7]/10 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4 text-[#8CFFB7]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
