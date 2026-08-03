import React, { useEffect, useState } from 'react';
import { X, Table, Database, Eye } from 'lucide-react';
import { DataFrame } from '../types';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose }) => {
  const [schemaText, setSchemaText] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DataFrame | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchSchema();
      fetchTables();
    }
  }, [isOpen]);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/schema');
      const data = await res.json();
      setSchemaText(data.summary || '');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTable = async (tableName: string) => {
    setSelectedTable(tableName);
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-black/90 border border-[#8CFFB7]/30 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-black/80 border-b border-[#8CFFB7]/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-lg text-[#8CFFB7]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Database Schema Inspector</h3>
              <p className="text-xs text-slate-400">Inspect active SQLite tables, columns, foreign keys, and preview data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#8CFFB7]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Table Selector Sidebar */}
          <div className="w-64 border-r border-[#8CFFB7]/20 bg-black/60 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
            <span className="text-xs font-semibold text-[#8CFFB7] px-2 py-1 uppercase tracking-wider">
              Tables ({tables.length})
            </span>
            {tables.map((tbl) => (
              <button
                key={tbl}
                onClick={() => handleSelectTable(tbl)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedTable === tbl
                    ? 'bg-[#8CFFB7]/20 text-[#8CFFB7] border border-[#8CFFB7]/40'
                    : 'text-slate-300 hover:bg-[#8CFFB7]/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-[#8CFFB7]" />
                  <span>{tbl}</span>
                </div>
                <Eye className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>

          {/* Content Pane */}
          <div className="flex-1 p-4 overflow-y-auto bg-black/40">
            {selectedTable ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-[#8CFFB7] flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Table: {selectedTable}
                  </h4>
                  <span className="text-xs text-slate-400">
                    Previewing up to 50 rows
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">Loading table data...</div>
                ) : tableData && tableData.columns.length > 0 ? (
                  <div className="overflow-x-auto border border-[#8CFFB7]/30 rounded-xl bg-black max-h-[55vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-black/80 text-[#8CFFB7] font-semibold border-b border-[#8CFFB7]/30 sticky top-0">
                          {tableData.columns.map((c, i) => (
                            <th key={i} className="p-2.5 font-mono text-[#8CFFB7] border-r border-[#8CFFB7]/20">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#8CFFB7]/10">
                        {tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#8CFFB7]/10">
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
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">Table is empty</div>
                )}
              </div>
            ) : (
              <div>
                <h4 className="text-xs font-semibold text-[#8CFFB7] uppercase tracking-wider mb-2">
                  Full Schema Definition
                </h4>
                <pre className="p-4 bg-black/80 border border-[#8CFFB7]/30 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {schemaText || 'Loading schema...'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
