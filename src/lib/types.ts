export interface Cliente {
  id: string
  nome: string
  data_nascimento?: string
  endereco?: string
  email?: string
  celular?: string
  ocupacao?: string
  indicacao?: string
  termo_aceito?: boolean
  observacoes?: string
  created_at?: string
}

export interface Anamnese {
  id: string
  cliente_id: string
  tratamentos_anteriores?: boolean
  tratamentos_obs?: string
  doencas?: boolean
  doencas_obs?: string
  herpes?: boolean
  alergias?: boolean
  alergias_obs?: string
  medicamento_continuo?: boolean
  medicamento_obs?: string
  fuma?: boolean
  bebe?: boolean
  gravida?: boolean
  isotretinoina?: boolean
  historico_queloide?: boolean
}

export interface Sessao {
  id: string
  cliente_id: string
  numero_sessao: number
  data?: string
  horario?: string
  valor?: number
  /** Sinal cobrado para reservar o horário. */
  sinal?: number
  sinal_pago?: boolean
  observacoes?: string
  status?: 'agendada' | 'realizada' | 'remarcada' | 'faltou'
  created_at?: string
}

/** Projeto de tatuagem a ser feito para o cliente. */
export interface Tatuagem {
  id?: string
  cliente_id?: string
  ideia_referencia?: string
  estilo?: string
  local_corpo?: string
  tamanho_cm?: number
  orcamento?: number
  cobertura?: boolean
  created_at?: string
}

export interface FotoSessao {
  id: string
  sessao_id: string
  url: string
  created_at?: string
}

export interface Orcamento {
  id: string
  cliente_id: string
  descricao?: string
  valor?: number
  status?: 'pendente' | 'aprovado' | 'recusado'
  validade?: string
  observacoes?: string
  created_at?: string
}

export interface Lancamento {
  id: string
  tipo: 'entrada' | 'saida'
  descricao?: string
  categoria?: string
  valor: number
  data: string
  pago: boolean
  created_at?: string
}

export interface ItemEstoque {
  id: string
  nome: string
  categoria?: string
  quantidade: number
  unidade?: string
  minimo: number
  created_at?: string
}
