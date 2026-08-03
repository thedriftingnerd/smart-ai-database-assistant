import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { DataTable } from './DataTable';
import { Send, Bot, User, Code2, AlertTriangle, Sparkles, Terminal, Cpu } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  loading: boolean;
}

const SAMPLE_PROMPTS = [
  "Show all open support tickets grouped by priority.",
  "Which employees have assigned laptops that are overdue for warranty renewal?",
  "Count hardware assets by status and type.",
  "What is the most recent database change logged in audit trail?",
  "List security-related tickets from the last 30 days.",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, loading }) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full rounded-2xl dash-card overflow-hidden border border-[#8CFFB7]/30 shadow-2xl relative">
      {/* Dashboard Blade Header */}
      <div className="dash-card-header px-5 py-3 flex items-center justify-between border-b border-[#8CFFB7]/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8CFFB7] shadow-md shadow-[#8CFFB7]/80 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8CFFB7] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#8CFFB7]" />
            Database Assistant
          </span>
        </div>
      </div>

      {/* Message & Results Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-black/40">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 px-4 text-center">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#8CFFB7]/20 via-emerald-600/30 to-green-800/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#8CFFB7]/10 text-[#8CFFB7] border border-[#8CFFB7]/40">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1 tracking-tight">AI Query Engine</h2>
            <p className="text-xs text-slate-400 mb-6">
              Type your query below or pick a suggested prompt to run automated SQL against your active database.
            </p>

            <div className="space-y-2 text-left">
              <span className="text-[11px] font-semibold text-[#8CFFB7] uppercase tracking-wider block px-1">
                Suggested Prompts
              </span>
              <div className="grid gap-2">
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(prompt)}
                    className="p-3 bg-black/80 hover:bg-[#8CFFB7]/10 border border-[#8CFFB7]/25 hover:border-[#8CFFB7]/60 rounded-xl text-xs text-slate-200 text-left transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span>{prompt}</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#8CFFB7]/70 group-hover:text-[#8CFFB7] shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-4xl mx-auto flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 text-[#8CFFB7] flex items-center justify-center shrink-0 mt-1 shadow-inner">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`space-y-3 flex-1 max-w-3xl ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-black font-medium ml-auto max-w-xl rounded-tr-none shadow-lg shadow-[#8CFFB7]/10 border border-[#8CFFB7]/50'
                      : 'bg-black/90 border border-[#8CFFB7]/25 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.usedModel && (
                    <div className="mt-2 text-[10px] text-[#8CFFB7]/80 flex items-center gap-1 font-mono">
                      <Cpu className="w-3 h-3 text-[#8CFFB7]" />
                      <span>Engine: {msg.usedModel}</span>
                    </div>
                  )}
                </div>

                {/* SQL Query Box */}
                {msg.sql && (
                  <div className="bg-black/90 border border-[#8CFFB7]/30 rounded-xl p-3 overflow-x-auto text-xs font-mono shadow-inner">
                    <div className="flex items-center gap-1.5 text-[#8CFFB7] mb-1.5 font-sans font-semibold text-[11px]">
                      <Code2 className="w-3.5 h-3.5 text-[#8CFFB7]" />
                      <span>Executed SQL Query:</span>
                    </div>
                    <pre className="text-[#8CFFB7] whitespace-pre-wrap leading-relaxed">{msg.sql}</pre>
                  </div>
                )}

                {/* Error Message */}
                {msg.error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{msg.error}</span>
                  </div>
                )}

                {/* Query Result DataFrame */}
                {msg.dataframe && <DataTable data={msg.dataframe} sql={msg.sql} />}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#8CFFB7]/20 border border-[#8CFFB7]/40 text-[#8CFFB7] flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="max-w-4xl mx-auto flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8CFFB7]/10 border border-[#8CFFB7]/30 text-[#8CFFB7] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 bg-black/80 border border-[#8CFFB7]/30 rounded-2xl rounded-tl-none text-xs text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#8CFFB7] rounded-full animate-ping" />
              <span>Analyzing schema & executing automated SQL query...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Embedded Prompt Box Footer */}
      <div className="p-4 bg-black/80 border-t border-[#8CFFB7]/20 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your prompt here (e.g. 'Show all open tickets')..."
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 bg-black/80 border border-[#8CFFB7]/30 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8CFFB7] focus:ring-1 focus:ring-[#8CFFB7] transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="absolute right-2 p-2 bg-[#8CFFB7] hover:bg-[#b2ffd0] disabled:opacity-40 text-black font-bold rounded-lg transition-all shadow-md shadow-[#8CFFB7]/20"
            title="Execute Query Prompt"
          >
            <Send className="w-4 h-4 fill-black" />
          </button>
        </form>
      </div>
    </div>
  );
};

