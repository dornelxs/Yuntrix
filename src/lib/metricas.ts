import { STATUS_LEAD, type StatusLead } from "./status-lead";

/**
 * Regra única de métricas do funil.
 *
 * Contamos LEADS pelo status ATUAL — nunca eventos de `lead_activities`.
 * Contar eventos inflava os números: um clique errado em "fechado" ficava
 * contabilizado como conversão para sempre, mesmo depois de voltar o lead,
 * e fechar duas vezes contava duas conversões.
 *
 * O recorte é por coorte: os leads considerados são os IMPORTADOS no
 * período (`criado_em` dentro da janela). Assim numerador e denominador
 * olham o mesmo conjunto e a taxa nunca passa de 100%.
 */

/** Posição de cada status no funil. Quanto maior, mais avançado. */
const ORDEM_FUNIL: Record<StatusLead, number> = {
  sem_contato: 0,
  contatado: 1,
  interessado: 2,
  fechado: 3,
  sem_interesse: -1, // saiu do funil, não é progresso
};

/** O lead alcançou (pelo menos) esta etapa do funil? */
function alcancou(status: string, etapa: StatusLead): boolean {
  const atual = ORDEM_FUNIL[status as StatusLead];
  if (atual === undefined) return false;
  // "sem_interesse" já foi contatado — quem recusa é porque foi abordado.
  if (status === "sem_interesse") return etapa === "contatado";
  return atual >= ORDEM_FUNIL[etapa];
}

export interface MetricasFunil {
  /** Leads do período (denominador de todas as taxas). */
  total: number;
  /** Chegaram pelo menos a "contatado" (inclui os que recusaram depois). */
  contatados: number;
  /** Chegaram pelo menos a "interessado". */
  interessados: number;
  /** Estão fechados AGORA. */
  fechados: number;
  /** Estão sem interesse AGORA. */
  semInteresse: number;
  /** Ainda sem contato. */
  semContato: number;
  /** fechados / total, em %. */
  taxaConversao: number;
}

/**
 * Calcula o funil a partir dos leads do período (já filtrados por data).
 * Espera apenas o `status` atual de cada lead.
 */
export function calcularFunil(leads: { status: string | null }[]): MetricasFunil {
  const total = leads.length;

  let contatados = 0;
  let interessados = 0;
  let fechados = 0;
  let semInteresse = 0;
  let semContato = 0;

  for (const { status } of leads) {
    const s = status ?? "sem_contato";
    if (alcancou(s, "contatado")) contatados += 1;
    if (alcancou(s, "interessado")) interessados += 1;
    if (s === "fechado") fechados += 1;
    if (s === "sem_interesse") semInteresse += 1;
    if (s === "sem_contato") semContato += 1;
  }

  return {
    total,
    contatados,
    interessados,
    fechados,
    semInteresse,
    semContato,
    taxaConversao: total ? (fechados / total) * 100 : 0,
  };
}

export { STATUS_LEAD };
