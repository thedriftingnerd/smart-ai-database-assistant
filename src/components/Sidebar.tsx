import React, { useRef } from 'react';
import { AppStatus } from '../types';
import {
  RotateCcw,
  ShieldCheck,
  Edit3,
  Layers,
  Trash2,
  Server,
  Upload,
} from 'lucide-react';

interface SidebarProps {
  status: AppStatus | null;
  onResetDb: () => void;
  onEnableAudit: () => void;
  onOpenModifyModal: () => void;
  onOpenSchemaModal: () => void;
  onClearHistory: () => void;
  onUploadDatabase: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  status,
  onResetDb,
  onEnableAudit,
  onOpenModifyModal,
  onOpenSchemaModal,
  onClearHistory,
  onUploadDatabase,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadDatabase(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-full lg:w-80 h-full rounded-2xl dash-card border border-[#8CFFB7]/30 overflow-hidden flex flex-col shrink-0 shadow-2xl relative">
      {/* Dashboard Blade Header */}
      <div className="dash-card-header px-5 py-3 flex items-center justify-between border-b border-[#8CFFB7]/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8CFFB7] shadow-md shadow-[#8CFFB7]/80" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8CFFB7] flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#8CFFB7]" />
            System Dashboard
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1 bg-black/40">
        {/* Status Box */}
        <div>
          <h2 className="text-[11px] font-bold text-[#8CFFB7] uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Database Metrics</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CFFB7]" />
          </h2>

          <div className="bg-black/80 border border-[#8CFFB7]/30 rounded-xl p-3.5 flex flex-col gap-2.5 text-xs shadow-inner">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">AI Model:</span>
              <span className="font-mono text-[#8CFFB7] font-semibold">{status?.activeModel || 'gemini-3.6-flash'}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Active DB:</span>
              <span className="font-mono text-[#8CFFB7] font-semibold truncate max-w-[130px]" title={status?.databaseName}>
                {status?.databaseName || 'default_database.db'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Total Tables:</span>
              <span className="font-mono text-white font-bold text-sm">{status?.tablesCount ?? 0}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Total Rows:</span>
              <span className="font-mono text-white font-bold text-sm">{status?.totalRows ?? 0}</span>
            </div>

            <div className="pt-2 border-t border-[#8CFFB7]/20 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Audit Trail Triggers:</span>
              <span className={status?.auditTrailEnabled ? 'text-[#8CFFB7] font-semibold' : 'text-slate-500'}>
                {status?.auditTrailEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Controls */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold text-[#8CFFB7] uppercase tracking-wider mb-1">Quick Actions</h3>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".db,.sqlite,.sqlite3"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-[#8CFFB7]/20 via-[#8CFFB7]/10 to-transparent hover:from-[#8CFFB7]/30 hover:to-[#8CFFB7]/10 border border-[#8CFFB7]/50 rounded-xl text-xs font-semibold text-white transition-all shadow-md group"
          >
            <Upload className="w-4 h-4 text-[#8CFFB7] shrink-0 group-hover:scale-110 transition-transform" />
            <span>Select Your Database (.db)</span>
          </button>

          <button
            onClick={onOpenSchemaModal}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-[#8CFFB7] shrink-0" />
            <span>Inspect Schema & Data</span>
          </button>

          <button
            onClick={onResetDb}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-[#8CFFB7] shrink-0" />
            <span>Reset to Default Database</span>
          </button>

          <button
            onClick={onEnableAudit}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-[#8CFFB7] shrink-0" />
            <span>Enable Audit Triggers</span>
          </button>

          <button
            onClick={onOpenModifyModal}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-medium text-amber-300 transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Execute Direct SQL (Modify)</span>
          </button>
        </div>

        {/* Chat Management */}
        <div className="pt-2 border-t border-[#8CFFB7]/20 mt-auto">
          <button
            onClick={onClearHistory}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-medium text-rose-300 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Workspace History</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
