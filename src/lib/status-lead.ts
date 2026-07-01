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
  fechado: "bg-green-100 text-green-700",
  sem_interesse: "bg-error-container text-on-error-container",
};

export const PRIORIDADE_COR: Record<string, string> = {
  alta: "bg-error",
  media: "bg-yellow-500",
  baixa: "bg-secondary",
};

export const PRIORIDADE_LABEL: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};
