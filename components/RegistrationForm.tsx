
import React, { useState, useEffect } from 'react';
import { db } from '../dbService';
import { Procedure, InsuranceType, PaymentMethod } from '../types';
import { Icons, COLORS } from '../constants';

interface Props {
  onSave: () => void;
  editData: Procedure | null;
}

const RegistrationForm: React.FC<Props> = ({ onSave, editData }) => {
  const [formData, setFormData] = useState<Omit<Procedure, 'id' | 'status' | 'received_status' | 'glosa_amount'>>({
    patient_name: '',
    date: new Date().toISOString().split('T')[0],
    procedure_name: '',
    tuss_code: '',
    insurance: 'Unimed',
    payment_method: undefined,
    procedure_value: 0
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        patient_name: editData.patient_name,
        date: editData.date,
        procedure_name: editData.procedure_name,
        tuss_code: editData.tuss_code || '',
        insurance: editData.insurance,
        payment_method: editData.payment_method,
        procedure_value: editData.procedure_value
      });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveProcedure({
      ...formData,
      id: editData?.id,
      status: editData?.status || 'pending',
      received_status: editData?.received_status || 'nao_recebido',
      glosa_amount: editData?.glosa_amount || 0,
      observations: editData?.observations || ''
    });
    onSave();
  };

  const inputClass = "w-full bg-[#F9FAFB] border border-gray-100 p-4 rounded-2xl outline-none focus:border-[#E67E22] transition-colors font-medium text-[#4A2311] placeholder:text-gray-300";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2";

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border-t-[12px] border-[#E67E22] overflow-hidden p-12">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-16 h-16 bg-[#FFF2E6] rounded-full flex items-center justify-center text-[#E67E22]">
          <Icons.Plus />
        </div>
        <div>
          <h2 className="text-3xl font-black text-[#4A2311]">Novo Atendimento</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestão de Honorários Médicos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>Convênio</label>
            <select 
              value={formData.insurance}
              onChange={e => setFormData({...formData, insurance: e.target.value as InsuranceType})}
              className={inputClass}
            >
              <option value="Unimed">Unimed</option>
              <option value="Particular">Particular</option>
              <option value="Público">Público</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Valor do Procedimento</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#E67E22] text-sm">R$</span>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.procedure_value}
                onChange={e => setFormData({...formData, procedure_value: parseFloat(e.target.value)})}
                placeholder="0.00"
                className={`${inputClass} pl-12`}
              />
            </div>
          </div>
        </div>

        {formData.insurance === 'Particular' && (
          <div className="animate-fadeIn">
            <label className={labelClass}>Método de Pagamento</label>
            <select 
              value={formData.payment_method}
              onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})}
              className={inputClass}
            >
              <option value="Dinheiro">Dinheiro</option>
              <option value="Sicredi">Sicredi</option>
              <option value="Banco do Brasil">Banco do Brasil</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Nome do Paciente</label>
          <input 
            type="text" 
            required
            value={formData.patient_name}
            onChange={e => setFormData({...formData, patient_name: e.target.value})}
            placeholder="Nome completo"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>Data</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Código TUSS</label>
            <input 
              type="text" 
              value={formData.tuss_code}
              onChange={e => setFormData({...formData, tuss_code: e.target.value})}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição do Procedimento</label>
          <input 
            type="text" 
            required
            value={formData.procedure_name}
            onChange={e => setFormData({...formData, procedure_name: e.target.value})}
            placeholder="Nome do exame ou procedimento"
            className={inputClass}
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-[#E67E22] text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-[#D35400] transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-100"
        >
          <Icons.Check /> {editData ? 'ATUALIZAR CADASTRO' : 'CONCLUIR CADASTRO'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
