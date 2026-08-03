import React, { useEffect, useState } from 'react';
import { AppStatus, ChatMessage } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ModifyDbModal } from './components/ModifyDbModal';
import { SchemaViewerModal } from './components/SchemaViewerModal';

export const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const historyForLlm = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          conversationHistory: historyForLlm,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Response received.',
        sql: data.sql,
        dataframe: data.dataframe,
        error: data.error,
        usedModel: data.usedModel,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      fetchStatus();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'The request could not be completed.',
        error: err?.message || 'Network error occurred.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/reset-db', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Database reset successfully.');
      fetchStatus();
    } catch (err) {
      alert('Failed to reset database.');
    }
  };

  const handleEnableAudit = async () => {
    try {
      const res = await fetch('/api/enable-audit', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Audit trail enabled.');
      fetchStatus();
    } catch (err) {
      alert('Failed to enable audit trail.');
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const handleUploadDatabase = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) return;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const res = await fetch('/api/upload-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            dataBase64: base64,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Active database updated to **${file.name}**. You can now ask questions to query this database!`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          fetchStatus();
        } else {
          alert(`Error loading database: ${data.error || 'Unknown error'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert(`Failed to read file: ${err?.message || err}`);
    }
  };

  return (
    <div className="min-h-screen gemini-bg text-slate-100 flex flex-col font-sans">
      <Header
        status={status}
        onRefresh={fetchStatus}
        onOpenSchema={() => setIsSchemaModalOpen(true)}
      />

      <main className="flex-1 p-3 md:p-6 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row gap-5 h-[calc(100vh-80px)] overflow-hidden">
        {/* Card 1: Prompt Box & Query Results Workspace */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />

        {/* Card 2: Dashboard & Status Sidebar */}
        <Sidebar
          status={status}
          onResetDb={handleResetDb}
          onEnableAudit={handleEnableAudit}
          onOpenModifyModal={() => setIsModifyModalOpen(true)}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
          onClearHistory={handleClearHistory}
          onUploadDatabase={handleUploadDatabase}
        />
      </main>

      <ModifyDbModal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        onSuccess={() => {
          fetchStatus();
        }}
      />

      <SchemaViewerModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};

export default App;
