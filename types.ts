
export type InsuranceType = 'Unimed' | 'Particular' | 'Público';
export type PaymentMethod = 'Dinheiro' | 'Sicredi' | 'Banco do Brasil' | 'Outro';
export type ProcedureStatus = 'pending' | 'paid' | 'glosa';
export type ReceivedStatus = 'recebido' | 'nao_recebido';

export interface Procedure {
  id: string;
  patient_name: string;
  date: string;
  procedure_name: string;
  tuss_code?: string;
  insurance: InsuranceType;
  payment_method?: PaymentMethod;
  procedure_value: number;
  status: ProcedureStatus;
  received_status: ReceivedStatus;
  glosa_amount: number;
  observations?: string;
  created_at?: string;
}

export interface AuditResult {
  patientName: string;
  date: string;
  procedureName: string;
  tussCode: string;
  procedureValue: number;
  glosaAmount: number;
  status: 'pago' | 'glosa';
}

export interface DashboardStats {
  totalFaturado: number;
  totalRecebido: number;
  totalGlosado: number;
  pendingCount: number;
}
