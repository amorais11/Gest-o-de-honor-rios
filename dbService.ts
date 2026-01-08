
import { createClient } from '@supabase/supabase-js';
import { Procedure, DashboardStats } from './types';

const SUPABASE_URL = 'https://eljhqxhskppyyrexwccd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pQEJquJhvUmZb36CPSxu0A_y9HC2hri';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  getProcedures: async (): Promise<Procedure[]> => {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching procedures:', error);
      return [];
    }
    return data || [];
  },

  saveProcedure: async (procedure: Omit<Procedure, 'id' | 'created_at'> & { id?: string }): Promise<void> => {
    // Clean up object for Supabase
    const { id, ...payload } = procedure;
    
    if (id) {
      const { error } = await supabase
        .from('procedures')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('procedures')
        .insert([payload]);
      if (error) throw error;
    }
  },

  updateStatus: async (id: string, updates: Partial<Procedure>): Promise<void> => {
    const { error } = await supabase
      .from('procedures')
      .update(updates)
      .eq('id', id);
    if (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },

  getStats: async (): Promise<DashboardStats> => {
    const procs = await db.getProcedures();
    return procs.reduce((acc, p) => ({
      totalFaturado: acc.totalFaturado + p.procedure_value,
      totalRecebido: acc.totalRecebido + (p.received_status === 'recebido' ? p.procedure_value : 0),
      totalGlosado: acc.totalGlosado + (p.glosa_amount || 0),
      pendingCount: acc.pendingCount + (p.status === 'pending' ? 1 : 0)
    }), { totalFaturado: 0, totalRecebido: 0, totalGlosado: 0, pendingCount: 0 });
  },

  findMatch: async (patientName: string, date: string): Promise<Procedure | undefined> => {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .ilike('patient_name', `%${patientName}%`)
      .eq('date', date)
      .limit(1);

    if (error || !data || data.length === 0) return undefined;
    return data[0];
  }
};
