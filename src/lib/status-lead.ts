export const STATUS_LEAD = [
  "sem_contato",
  "contatado",
  "interessado",
  "fechado",
  "sem_interesse",
] as const;

export type StatusLead = (typeof STATUS_LEAD)[number];

export const STATUS_LABEL: Record<StatusLead, string> = {
  sem_contato: "Sem contato",
  contatado: "Contatado",
  interessado: "Interessado",
  fechado: "Fechado",
  sem_interesse: "Sem interesse",
};

export const STATUS_BADGE_CLASS: Record<StatusLead, string> = {
  sem_contato: "bg-surface-variant text-on-surface-variant",
  contatado: "bg-secondary-container text-on-secondary-container",
  interessado: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  fechado: "bg-green-500/15 text-green-400",
  sem_interesse: "bg-error-container text-on-error-container",
};

// Cores fortes e fixas (não seguem o tema) para a prioridade ser
// sempre legível: vermelho = alta, âmbar = média, verde = baixa.
export const PRIORIDADE_COR: Record<string, string> = {
  alta: "bg-red-500",
  media: "bg-amber-400",
  baixa: "bg-emerald-500",
};

export const PRIORIDADE_TEXTO: Record<string, string> = {
  alta: "text-red-400",
  media: "text-amber-400",
  baixa: "text-emerald-400",
};

export const PRIORIDADE_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};
