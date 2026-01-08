
import React, { useState, useEffect } from 'react';
import { Icons, COLORS } from './constants';
import RegistrationForm from './components/RegistrationForm';
import RecordsList from './components/RecordsList';
import AuditModule from './components/AuditModule';
import { Procedure } from './types';
import { db, supabase } from './dbService';

type Tab = 'cadastro' | 'registros' | 'auditoria';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('cadastro');
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('procedures').select('id').limit(1);
        setDbStatus(error ? 'offline' : 'online');
      } catch {
        setDbStatus('offline');
      }
    };

    checkConnection();
    // Re-check periodically
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEdit = (proc: Procedure) => {
    setEditingProcedure(proc);
    setActiveTab('cadastro');
  };

  const handleFinishSave = () => {
    setEditingProcedure(null);
    setActiveTab('registros');
    triggerSync();
  };

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 pt-10 flex flex-col md:flex-row justify-between items-center gap-8 animate-fadeIn no-print">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-[#8B3E2F] text-5xl font-logo leading-none">JM</h1>
            <p className="text-[#4A2311] font-black tracking-[0.2em] text-sm mt-1 uppercase">Dra. Joelma Morais</p>
            <div className="w-16 h-1 bg-[#E67E22] mt-2 rounded-full"></div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 
              dbStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
            }`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {dbStatus === 'online' ? 'Supabase Conectado' : 
               dbStatus === 'offline' ? 'Erro de Conexão' : 'Verificando...'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="bg-white p-1.5 rounded-full shadow-xl flex items-center gap-1 border border-gray-100">
          <button 
            onClick={() => setActiveTab('cadastro')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-extrabold text-xs uppercase tracking-wider ${activeTab === 'cadastro' ? 'bg-[#E67E22] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Icons.Plus /> CADASTRO
          </button>
          <button 
            onClick={() => setActiveTab('registros')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-extrabold text-xs uppercase tracking-wider ${activeTab === 'registros' ? 'bg-[#E67E22] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Icons.Registers /> REGISTROS
          </button>
          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-extrabold text-xs uppercase tracking-wider ${activeTab === 'auditoria' ? 'bg-[#E67E22] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Icons.Audit /> AUDITORIA AI
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto mt-12 px-4 relative">
        {/* Sync Loader Overlay */}
        {isSyncing && (
          <div className="absolute -top-10 right-4 flex items-center gap-2 text-[#E67E22] font-semibold animate-fadeIn">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sincronizando...
          </div>
        )}

        {activeTab === 'cadastro' && (
          <div className="animate-slideUp">
            <RegistrationForm 
              onSave={handleFinishSave} 
              editData={editingProcedure} 
            />
          </div>
        )}

        {activeTab === 'registros' && (
          <div className="animate-slideUp">
            <RecordsList onEdit={handleEdit} />
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div className="animate-slideUp">
            <AuditModule onAuditFinished={triggerSync} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
