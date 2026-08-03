import React, { useState } from 'react';
import { X, Play, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ModifyDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModifyDbModal: React.FC<ModifyDbModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [sqlStatement, setSqlStatement] = useState(
    "UPDATE support_tickets SET status = 'In Progress' WHERE ticket_id = 3;"
  );
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!confirmed) {
      setErrorMessage('Confirm the checkbox before executing a modifying SQL statement.');
      return;
    }

    setLoading(true);
    setResultMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlStatement }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      setResultMessage(data.message || 'Statement executed successfully.');
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to execute SQL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-black/90 border border-[#8CFFB7]/30 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#8CFFB7]/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Modify Database</h3>
            <p className="text-xs text-slate-400">Execute direct SQL DML/DDL statements against SQLite</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          This runs raw SQL against the selected SQLite database and can modify tables, triggers, rows, or schema.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#8CFFB7] mb-1">SQL Statement</label>
          <textarea
            value={sqlStatement}
            onChange={(e) => setSqlStatement(e.target.value)}
            rows={5}
            className="w-full p-3 bg-black/80 border border-[#8CFFB7]/30 rounded-xl font-mono text-xs text-[#8CFFB7] focus:outline-none focus:border-[#8CFFB7] shadow-inner"
            placeholder="ENTER SQL HERE..."
          />
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input
            type="checkbox"
            id="confirmModify"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-[#8CFFB7]/40 bg-black text-[#8CFFB7] focus:ring-[#8CFFB7]"
          />
          <label htmlFor="confirmModify" className="text-xs text-slate-300 select-none cursor-pointer">
            I understand this changes the selected database
          </label>
        </div>

        {resultMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 text-slate-300 text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{loading ? 'Executing...' : 'Execute SQL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
