import React from 'react';
import { AppStatus } from '../types';
import { Database, Sparkles, ShieldCheck, AlertCircle, Layers, RefreshCw } from 'lucide-react';

interface HeaderProps {
  status: AppStatus | null;
  onRefresh: () => void;
  onOpenSchema: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onRefresh, onOpenSchema }) => {
  return (
    <header className="bg-black/80 border-b border-[#8CFFB7]/20 p-4 sticky top-0 z-30 backdrop-blur-xl shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#8CFFB7]/20 via-emerald-600/20 to-green-800/20 rounded-2xl shadow-lg shadow-[#8CFFB7]/10 text-[#8CFFB7] flex items-center justify-center border border-[#8CFFB7]/40">
            <Database className="w-6 h-6 text-[#8CFFB7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Databassistant
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              A Smart AI-Powered Assistant to Query a Database with Ease!
            </p>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black/60 border border-[#8CFFB7]/30 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#8CFFB7] animate-pulse" />
            <span className="text-slate-400">Engine:</span>
            <span className="font-semibold text-[#8CFFB7]">{status?.pythonEngine || 'Python 3.10 (sqlite3)'}</span>
          </div>

          <div className="flex items-center gap-2 bg-black/60 border border-[#8CFFB7]/30 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#8CFFB7]" />
            <span className="text-slate-400">Model:</span>
            <span className="font-semibold text-[#8CFFB7]">{status?.activeModel || 'gemini-3.6-flash'}</span>
          </div>

          <button
            onClick={onOpenSchema}
            className="flex items-center gap-2 bg-black/60 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-[#8CFFB7]" />
            <span>Tables: <strong className="text-white">{status?.tablesCount ?? 0}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Rows: <strong className="text-white">{status?.totalRows ?? 0}</strong></span>
          </button>

          {status?.auditTrailEnabled && (
            <div className="flex items-center gap-1.5 bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 rounded-xl px-3 py-1.5 text-xs text-[#8CFFB7]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Log Active</span>
            </div>
          )}

          {!status?.isKeyConfigured && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-400" title="GEMINI_API_KEY environment variable is missing">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Fallback Mode</span>
            </div>
          )}

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-black/60 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 text-slate-400 hover:text-white transition-all"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
