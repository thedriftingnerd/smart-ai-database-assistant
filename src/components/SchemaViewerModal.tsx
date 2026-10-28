import React, { useEffect, useState } from 'react';
import { X, Table, Database, Eye, BarChart2, GitFork, FileCode } from 'lucide-react';
import { DataFrame, TableDetail } from '../types';
import { ErDiagram } from './ErDiagram';
import { DataVisualizer } from './DataVisualizer';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalViewTab = 'er-diagram' | 'table-data' | 'sql-schema';

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ModalViewTab>('er-diagram');
  const [schemaText, setSchemaText] = useState<string>('');
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [detailedTables, setDetailedTables] = useState<TableDetail[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DataFrame | null>(null);
  const [tableSubView, setTableSubView] = useState<'table' | 'visualizer'>('table');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchSchema();
    }
  }, [isOpen]);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/schema');
      const data = await res.json();
      setSchemaText(data.summary || '');
      if (data.tables && Array.isArray(data.tables)) {
        setDetailedTables(data.tables);
        setTablesList(data.tables.map((t: TableDetail) => t.name));
      } else {
        const tRes = await fetch('/api/tables');
        const tData = await tRes.json();
        setTablesList(tData.tables || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTable = async (tableName: string, defaultSubView: 'table' | 'visualizer' = 'table') => {
    setSelectedTable(tableName);
    setTableSubView(defaultSubView);
    setActiveTab('table-data');
    setLoading(true);
    try {
      const res = await fetch(`/api/table/${tableName}`);
      const data = await res.json();
      setTableData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-black/95 border border-[#8CFFB7]/30 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 bg-black/80 border-b border-[#8CFFB7]/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#8CFFB7]/15 border border-[#8CFFB7]/30 rounded-xl text-[#8CFFB7]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Database Schema & Diagrams
              </h3>
              <p className="text-xs text-slate-400">
                Explore entity-relationship diagrams, foreign keys, table preview, and data visualizers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-black/70 border border-[#8CFFB7]/30 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => setActiveTab('er-diagram')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'er-diagram'
                    ? 'bg-[#8CFFB7] text-black shadow-md shadow-[#8CFFB7]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#8CFFB7]/10'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>ER Diagram</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('table-data');
                  if (!selectedTable && tablesList.length > 0) {
                    handleSelectTable(tablesList[0], 'table');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'table-data'
                    ? 'bg-[#8CFFB7] text-black shadow-md shadow-[#8CFFB7]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#8CFFB7]/10'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table Data & Charts</span>
              </button>

              <button
                onClick={() => setActiveTab('sql-schema')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'sql-schema'
                    ? 'bg-[#8CFFB7] text-black shadow-md shadow-[#8CFFB7]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#8CFFB7]/10'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Raw DDL</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#8CFFB7]/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-black/40">
          {activeTab === 'er-diagram' ? (
            <ErDiagram
              tables={detailedTables}
              onSelectTableForPreview={(tbl) => handleSelectTable(tbl, 'table')}
              onSelectTableForChart={(tbl) => handleSelectTable(tbl, 'visualizer')}
            />
          ) : activeTab === 'table-data' ? (
            <div className="flex flex-col md:flex-row h-full gap-4">
              {/* Tables list left column */}
              <div className="w-full md:w-56 border border-[#8CFFB7]/20 rounded-xl bg-black/60 p-2 flex flex-col gap-1 shrink-0 overflow-y-auto max-h-48 md:max-h-full">
                <span className="text-[11px] font-semibold text-[#8CFFB7] px-2 py-1 uppercase tracking-wider">
                  Select Table ({tablesList.length})
                </span>
                {tablesList.map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => handleSelectTable(tbl, tableSubView)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedTable === tbl
                        ? 'bg-[#8CFFB7]/20 text-[#8CFFB7] border border-[#8CFFB7]/40'
                        : 'text-slate-300 hover:bg-[#8CFFB7]/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Table className="w-3.5 h-3.5 text-[#8CFFB7] shrink-0" />
                      <span className="truncate">{tbl}</span>
                    </div>
                    <Eye className="w-3 h-3 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Table Data or Visualizer Right Column */}
              <div className="flex-1 overflow-y-auto">
                {selectedTable ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-black/60 p-2.5 rounded-xl border border-[#8CFFB7]/20 text-xs">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-[#8CFFB7]" />
                        <span className="font-bold text-white font-mono text-sm">{selectedTable}</span>
                        <span className="text-slate-400">
                          ({tableData ? `${tableData.rows.length} rows loaded` : 'Loading...'})
                        </span>
                      </div>

                      {/* Sub-view toggle (Table vs Visualizer) */}
                      <div className="flex items-center bg-black border border-[#8CFFB7]/30 rounded-lg p-0.5">
                        <button
                          onClick={() => setTableSubView('table')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${
                            tableSubView === 'table'
                              ? 'bg-[#8CFFB7] text-black font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Table Rows</span>
                        </button>
                        <button
                          onClick={() => setTableSubView('visualizer')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${
                            tableSubView === 'visualizer'
                              ? 'bg-[#8CFFB7] text-black font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Interactive Charts</span>
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="py-16 text-center text-slate-400 text-xs">Loading table records...</div>
                    ) : tableData && tableData.columns.length > 0 ? (
                      tableSubView === 'visualizer' ? (
                        <DataVisualizer data={tableData} />
                      ) : (
                        <div className="overflow-x-auto border border-[#8CFFB7]/30 rounded-xl bg-black max-h-[60vh]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-black/90 text-[#8CFFB7] font-semibold border-b border-[#8CFFB7]/30 sticky top-0 backdrop-blur-sm">
                                {tableData.columns.map((c, i) => (
                                  <th key={i} className="p-2.5 font-mono text-[#8CFFB7] border-r border-[#8CFFB7]/20 whitespace-nowrap">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#8CFFB7]/10">
                              {tableData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-[#8CFFB7]/10 transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2.5 border-r border-[#8CFFB7]/10 whitespace-nowrap">
                                      {cell === null || cell === undefined ? (
                                        <span className="text-slate-600 italic">NULL</span>
                                      ) : (
                                        String(cell)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="py-12 text-center text-slate-500 text-xs">Table is empty</div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Select a table on the left to preview data or create visual charts.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[#8CFFB7] uppercase tracking-wider">
                  Full SQLite Schema DDL Definition
                </h4>
              </div>
              <pre className="p-4 bg-black/90 border border-[#8CFFB7]/30 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-[68vh] overflow-y-auto leading-relaxed">
                {schemaText || 'Loading schema definition...'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
