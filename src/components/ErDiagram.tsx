import React, { useState } from 'react';
import { TableDetail } from '../types';
import { Key, Link as LinkIcon, Database, ArrowRight, Eye, BarChart2, Search, Sparkles } from 'lucide-react';

interface ErDiagramProps {
  tables: TableDetail[];
  onSelectTableForPreview: (tableName: string) => void;
  onSelectTableForChart: (tableName: string) => void;
}

export const ErDiagram: React.FC<ErDiagramProps> = ({
  tables,
  onSelectTableForPreview,
  onSelectTableForChart,
}) => {
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Find relationships
  const relationships = React.useMemo(() => {
    const list: { fromTable: string; fromCol: string; toTable: string; toCol: string }[] = [];
    tables.forEach((t) => {
      t.foreignKeys.forEach((fk) => {
        list.push({
          fromTable: t.name,
          fromCol: fk.from,
          toTable: fk.toTable,
          toCol: fk.toColumn,
        });
      });
    });
    return list;
  }, [tables]);

  // Determine connected tables for highlighted state
  const connectedTableNames = React.useMemo(() => {
    if (!selectedTableName) return new Set<string>();
    const set = new Set<string>();
    set.add(selectedTableName);

    relationships.forEach((rel) => {
      if (rel.fromTable === selectedTableName) {
        set.add(rel.toTable);
      }
      if (rel.toTable === selectedTableName) {
        set.add(rel.fromTable);
      }
    });
    return set;
  }, [selectedTableName, relationships]);

  const filteredTables = tables.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.columns.some((c) => c.name.toLowerCase().includes(term) || c.type.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/60 p-3 rounded-xl border border-[#8CFFB7]/20 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#8CFFB7]/15 rounded-lg border border-[#8CFFB7]/30 text-[#8CFFB7]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Interactive Entity Relationship (ER) Diagram</h4>
            <p className="text-slate-400 text-[11px]">
              Visual schema map showing primary keys (PK), foreign keys (FK), and relational dependencies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8CFFB7]" />
            <input
              type="text"
              placeholder="Filter tables or columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-black/80 border border-[#8CFFB7]/30 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#8CFFB7]"
            />
          </div>

          {selectedTableName && (
            <button
              onClick={() => setSelectedTableName(null)}
              className="px-2.5 py-1 bg-[#8CFFB7]/20 border border-[#8CFFB7]/40 rounded-lg text-[#8CFFB7] hover:bg-[#8CFFB7]/30 transition-all text-xs"
            >
              Reset Focus
            </button>
          )}
        </div>
      </div>

      {/* Relational Links Ribbon */}
      {relationships.length > 0 && (
        <div className="p-3 bg-black/80 border border-[#8CFFB7]/20 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8CFFB7] mb-2 uppercase tracking-wider">
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Detected Foreign Key Relationships ({relationships.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {relationships.map((rel, idx) => {
              const isRelevant =
                !selectedTableName ||
                rel.fromTable === selectedTableName ||
                rel.toTable === selectedTableName;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedTableName(rel.fromTable)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                    isRelevant
                      ? 'bg-black/90 border-[#8CFFB7]/50 text-slate-200 shadow-sm shadow-[#8CFFB7]/10'
                      : 'bg-black/40 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <span className="text-[#8CFFB7] font-semibold">{rel.fromTable}</span>
                  <span className="text-slate-500 text-[10px]">({rel.fromCol})</span>
                  <ArrowRight className="w-3 h-3 text-[#8CFFB7]" />
                  <span className="text-cyan-300 font-semibold">{rel.toTable}</span>
                  <span className="text-slate-500 text-[10px]">({rel.toCol})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Entity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((tbl) => {
          const isSelected = selectedTableName === tbl.name;
          const isConnected = selectedTableName ? connectedTableNames.has(tbl.name) : true;

          return (
            <div
              key={tbl.name}
              onClick={() => setSelectedTableName(tbl.name)}
              className={`bg-black/90 border rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col ${
                isSelected
                  ? 'border-[#8CFFB7] ring-1 ring-[#8CFFB7] shadow-[#8CFFB7]/20 -translate-y-0.5'
                  : isConnected
                  ? 'border-[#8CFFB7]/30 hover:border-[#8CFFB7]/60'
                  : 'border-slate-800 opacity-50 hover:opacity-100'
              }`}
            >
              {/* Card Header */}
              <div className="p-3 bg-black/80 border-b border-[#8CFFB7]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#8CFFB7]/15 rounded-md text-[#8CFFB7]">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
                      {tbl.name}
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      {tbl.rowCount} rows • {tbl.columns.length} columns
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTableForChart(tbl.name);
                    }}
                    className="p-1.5 bg-[#8CFFB7]/20 hover:bg-[#8CFFB7]/30 text-[#8CFFB7] border border-[#8CFFB7]/40 rounded-lg text-xs transition-all"
                    title="Visualize Table with Charts"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTableForPreview(tbl.name);
                    }}
                    className="p-1.5 bg-black/60 hover:bg-black text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs transition-all"
                    title="Preview Data"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Column list */}
              <div className="p-2 space-y-1 divide-y divide-[#8CFFB7]/10 flex-1 overflow-y-auto max-h-56 text-xs font-mono">
                {tbl.columns.map((col) => {
                  const fkInfo = tbl.foreignKeys.find((fk) => fk.from === col.name);

                  return (
                    <div
                      key={col.name}
                      className="pt-1.5 pb-1 flex items-center justify-between gap-2 px-1 hover:bg-[#8CFFB7]/10 rounded"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {col.pk ? (
                          <span
                            className="p-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40"
                            title="Primary Key (PK)"
                          >
                            <Key className="w-2.5 h-2.5" />
                          </span>
                        ) : fkInfo ? (
                          <span
                            className="p-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40"
                            title={`Foreign Key -> ${fkInfo.toTable}.${fkInfo.toColumn}`}
                          >
                            <LinkIcon className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="w-2.5 h-2.5 inline-block" />
                        )}
                        <span className={`truncate ${col.pk ? 'text-amber-200 font-semibold' : fkInfo ? 'text-cyan-200' : 'text-slate-200'}`}>
                          {col.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {fkInfo && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1 py-0.2 rounded font-sans">
                            → {fkInfo.toTable}
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-sans">
                          {col.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Quick Action */}
              <div className="p-2 bg-black/60 border-t border-[#8CFFB7]/15 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTableForChart(tbl.name);
                  }}
                  className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs text-[#8CFFB7] hover:bg-[#8CFFB7]/15 rounded-lg border border-[#8CFFB7]/30 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Visual Charts for {tbl.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
