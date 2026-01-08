
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../dbService';
import { Procedure, ReceivedStatus } from '../types';
import { Icons } from '../constants';

interface Props {
  onEdit: (proc: Procedure) => void;
}

const RecordsList: React.FC<Props> = ({ onEdit }) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async () => {
    const data = await db.getProcedures();
    setProcedures(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleReceived = async (proc: Procedure) => {
    const nextStatus: ReceivedStatus = proc.received_status === 'recebido' ? 'nao_recebido' : 'recebido';
    // Optimistic update
    setProcedures(prev => prev.map(p => p.id === proc.id ? { ...p, received_status: nextStatus } : p));
    await db.updateStatus(proc.id, { received_status: nextStatus });
  };

  const updateObservation = async (id: string, text: string) => {
    // Update local state immediately for UI responsiveness
    setProcedures(prev => prev.map(p => p.id === id ? { ...p, observations: text } : p));
    
    // Debounced or direct update? For simplicity here, direct but you could debounce
    try {
      await db.updateStatus(id, { observations: text });
    } catch (e) {
      console.error("Failed to sync observation", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = procedures.filter(p => {
    if (!startDate && !endDate) return true;
    const d = new Date(p.date);
    const s = startDate ? new Date(startDate) : new Date('1900-01-01');
    const e = endDate ? new Date(endDate) : new Date('2100-01-01');
    return d >= s && d <= e;
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const totalFaturado = filtered.reduce((acc, p) => acc + p.procedure_value, 0);
  const totalRecebido = filtered.filter(p => p.received_status === 'recebido').reduce((acc, p) => acc + p.procedure_value, 0);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border-t-[12px] border-[#E67E22] p-8 md:p-12 overflow-hidden">
      {/* Print Header Section */}
      <div className="print-only mb-10 border-b-2 border-gray-100 pb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#4A2311]">Relatório de Atendimentos</h1>
            <p className="text-sm text-gray-500 font-medium">Dra. Joelma Morais | JM Gestão de Honorários</p>
          </div>
          <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Gerado em: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-[8px] font-black text-gray-400 uppercase">Total Faturado</p>
            <p className="text-xs font-bold text-[#E67E22]">{formatBRL(totalFaturado)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-[8px] font-black text-gray-400 uppercase">Total Recebido</p>
            <p className="text-xs font-bold text-emerald-600">{formatBRL(totalRecebido)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 no-print">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-[#4A2311]">Atendimentos Registrados</h2>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 text-[#E67E22] font-black uppercase tracking-widest text-[10px] bg-[#FFF2E6] w-fit px-5 py-2.5 rounded-full hover:bg-orange-100 transition-all border border-orange-100"
          >
            <Icons.PDF /> GERAR RELATÓRIO PDF
          </button>
        </div>
        
        <div className="flex items-center gap-3 bg-[#F9FAFB] p-4 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-[#E67E22] tracking-[0.2em] mb-1">Filtrar por Período</span>
            <div className="flex items-center gap-3">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="bg-white border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-[#4A2311] outline-none focus:border-[#E67E22]" 
              />
              <span className="text-[10px] text-gray-400 font-black">ATÉ</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="bg-white border-2 border-gray-100 rounded-xl px-3 py-1.5 text-xs font-bold text-[#4A2311] outline-none focus:border-[#E67E22]" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-4 print:border-collapse">
          <thead>
            <tr className="text-left">
              <th className="px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Paciente</th>
              <th className="px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Convênio</th>
              <th className="px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Procedimento</th>
              <th className="px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Valor</th>
              <th className="px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Pagamento</th>
              <th className="px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Observações</th>
              <th className="no-print px-6 pb-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(proc => (
              <tr key={proc.id} className="group transition-all">
                <td className="bg-[#F9FAFB] px-6 py-5 rounded-l-[1.5rem] border-y border-l border-gray-50 print:bg-white">
                  <div className="font-extrabold text-[#4A2311]">{proc.patient_name}</div>
                  <div className="text-[10px] text-gray-400 font-bold">{new Date(proc.date).toLocaleDateString('pt-BR')}</div>
                </td>
                <td className="bg-[#F9FAFB] px-6 py-5 border-y border-gray-50 print:bg-white">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${proc.insurance === 'Unimed' ? 'bg-[#FFF2E6] text-[#E67E22]' : 'bg-gray-100 text-gray-500'}`}>
                    {proc.insurance}
                  </span>
                </td>
                <td className="bg-[#F9FAFB] px-6 py-5 border-y border-gray-50 print:bg-white">
                  <div className="text-sm font-semibold text-[#8B3E2F]">{proc.procedure_name}</div>
                </td>
                <td className="bg-[#F9FAFB] px-6 py-5 border-y border-gray-50 text-right print:bg-white">
                  <div className="font-black text-[#4A2311]">{formatBRL(proc.procedure_value)}</div>
                </td>
                <td className="bg-[#F9FAFB] px-6 py-5 border-y border-gray-50 text-center print:bg-white">
                  <div className="no-print">
                    <button 
                      onClick={() => toggleReceived(proc)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        proc.received_status === 'recebido' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {proc.received_status === 'recebido' ? 'RECEBIDO' : 'NÃO RECEBIDO'}
                    </button>
                  </div>
                  <div className="print-only text-[9px] font-bold uppercase">
                    {proc.received_status === 'recebido' ? 'RECEBIDO' : 'PENDENTE'}
                  </div>
                </td>
                <td className="bg-[#F9FAFB] px-6 py-5 border-y border-gray-50 print:bg-white">
                  <div className="no-print min-w-[200px]">
                    <textarea 
                      rows={1}
                      placeholder="Nota rápida..."
                      value={proc.observations || ''}
                      onChange={(e) => updateObservation(proc.id, e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 focus:border-[#E67E22] outline-none resize-none overflow-hidden"
                    />
                  </div>
                  <div className="print-only text-[10px] text-gray-600 italic">
                    {proc.observations || '—'}
                  </div>
                </td>
                <td className="no-print bg-[#F9FAFB] px-6 py-5 rounded-r-[1.5rem] border-y border-r border-gray-50 text-right">
                  <button 
                    onClick={() => onEdit(proc)}
                    className="p-2 text-gray-300 hover:text-[#E67E22]"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordsList;
