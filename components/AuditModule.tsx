
import React, { useState, useRef } from 'react';
import { Icons } from '../constants.tsx';
import { analyzeStatement } from '../geminiService.ts';
import { AuditResult, Procedure } from '../types.ts';
import { db } from '../dbService.ts';

interface Props {
  onAuditFinished: () => void;
}

const AuditModule: React.FC<Props> = ({ onAuditFinished }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ai: AuditResult, local?: Procedure}[]>([]);
  const [summary, setSummary] = useState({ totalGlosado: 0, totalPendente: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      const extracted = await analyzeStatement(base64, file.type);
      
      const processedResults: {ai: AuditResult, local?: Procedure}[] = [];
      let totalGlosa = 0;

      for (const item of extracted) {
        const localMatch = await db.findMatch(item.patientName, item.date);
        processedResults.push({ ai: item, local: localMatch });
        totalGlosa += item.glosaAmount;

        if (localMatch) {
          await db.updateStatus(localMatch.id, {
            status: item.status === 'pago' ? 'paid' : 'glosa',
            glosa_amount: item.glosaAmount,
            received_status: item.status === 'pago' ? 'recebido' : localMatch.received_status
          });
        }
      }

      setResults(processedResults);
      setSummary({ totalGlosado: totalGlosa, totalPendente: processedResults.length });
      onAuditFinished();
    } catch (error) {
      alert("Erro ao processar arquivo. Verifique sua conexão e chave de API.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-t-[12px] border-[#E67E22] p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-[#FFF2E6] rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Icons.Upload />
          </div>
          <h2 className="text-3xl font-black text-[#4A2311] mb-2 uppercase tracking-tight">Auditoria AI</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-10">Inteligência Artificial Unimed</p>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-[#FFF2E6] rounded-[2rem] p-10 cursor-pointer hover:bg-[#F9FAFB] transition-all group"
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-[#E67E22]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="font-black text-[#E67E22] uppercase tracking-widest text-sm">Processando Extrato...</p>
              </div>
            ) : (
              <div>
                <p className="text-[#4A2311] font-black uppercase tracking-widest mb-1">Carregar Extrato</p>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">PDF Unimed ou Imagem</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="application/pdf,image/*" 
            />
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Impacto Financeiro</p>
              <h3 className="text-4xl font-black text-rose-500">{formatBRL(summary.totalGlosado)}</h3>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-1">Total em Glosas Identificadas</p>
            </div>
            
            <div className="bg-[#4A2311] p-10 rounded-[2rem] shadow-xl">
              <p className="text-[10px] font-black uppercase text-gray-200/50 tracking-widest mb-2">Eficiência da Auditoria</p>
              <h3 className="text-4xl font-black text-white">{results.filter(r => r.local).length} / {results.length}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Confrontos Encontrados</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl p-10 border border-gray-100">
            <h4 className="text-xl font-black text-[#4A2311] mb-8 uppercase tracking-tight">Divergências e Confirmações</h4>
            <div className="space-y-4">
              {results.map((res, i) => (
                <div key={i} className={`p-6 rounded-2xl border-l-8 flex justify-between items-center ${res.ai.status === 'glosa' ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${res.ai.status === 'glosa' ? 'bg-rose-200 text-rose-700' : 'bg-emerald-200 text-emerald-700'}`}>
                        {res.ai.status}
                      </span>
                      <p className="font-extrabold text-[#4A2311]">{res.ai.patientName}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-500 mt-1">{res.ai.procedureName}</p>
                    {res.local ? (
                      <p className="text-[9px] text-emerald-600 font-bold uppercase mt-2">✓ Sincronizado com registro manual</p>
                    ) : (
                      <p className="text-[9px] text-amber-600 font-bold uppercase mt-2">⚠ Registro manual não encontrado</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#4A2311]">{formatBRL(res.ai.procedureValue)}</p>
                    {res.ai.glosaAmount > 0 && <p className="text-xs font-bold text-rose-500">Glosa: {formatBRL(res.ai.glosaAmount)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditModule;
