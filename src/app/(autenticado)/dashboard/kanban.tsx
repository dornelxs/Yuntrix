"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import {
  STATUS_LEAD,
  STATUS_LABEL,
  PRIORIDADE_COR,
  type StatusLead,
} from "@/lib/status-lead";
import { atualizarStatusLead } from "../leads/[id]/actions";

interface LeadKanban {
  id: string;
  nome: string;
  nicho: string;
  status: string;
  prioridade: string | null;
  atualizado_em: string;
  atribuido_a: string | null;
  users: { nome: string }[] | { nome: string } | null;
}

interface KanbanProps {
  leadsIniciais: LeadKanban[];
  nichos: string[];
  funcionarios: { id: string; nome: string }[];
  isAdmin: boolean;
}

function horasDesde(dataIso: string): number {
  return (Date.now() - new Date(dataIso).getTime()) / (1000 * 60 * 60);
}

function tempoParado(dataIso: string): string {
  const horas = horasDesde(dataIso);
  if (horas < 1) return "agora há pouco";
  if (horas < 24) return `há ${Math.floor(horas)}h`;
  return `há ${Math.floor(horas / 24)}d`;
}

export function Kanban({ leadsIniciais, nichos, funcionarios, isAdmin }: KanbanProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function aplicarFiltro(chave: string, valor: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (valor) sp.set(chave, valor);
    else sp.delete(chave);
    router.push(`/dashboard?${sp.toString()}`);
  }

  function moverStatus(leadId: string, atual: StatusLead, direcao: 1 | -1) {
    const indice = STATUS_LEAD.indexOf(atual);
    const novoIndice = indice + direcao;
    if (novoIndice < 0 || novoIndice >= STATUS_LEAD.length) return;
    startTransition(async () => {
      await atualizarStatusLead(leadId, STATUS_LEAD[novoIndice]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select
          className="bg-white border border-outline-variant rounded-lg px-4 py-2 text-sm outline-none"
          value={searchParams.get("nicho") ?? ""}
          onChange={(e) => aplicarFiltro("nicho", e.target.value)}
        >
          <option value="">Todos os nichos</option>
          {nichos.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {isAdmin && (
          <select
            className="bg-white border border-outline-variant rounded-lg px-4 py-2 text-sm outline-none"
            value={searchParams.get("responsavel") ?? ""}
            onChange={(e) => aplicarFiltro("responsavel", e.target.value)}
          >
            <option value="">Todos os funcionários</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-2 -mx-4 lg:mx-0 snap-x snap-mandatory lg:snap-none">
        {STATUS_LEAD.map((status) => {
          const leadsColuna = leadsIniciais.filter((l) => l.status === status);
          return (
            <div
              key={status}
              className="flex flex-col shrink-0 w-full px-4 lg:w-auto lg:px-0 snap-start snap-always"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {STATUS_LABEL[status]}
                </h3>
                <span className="text-xs font-semibold bg-surface-container-high text-on-surface-variant rounded-full px-2 py-0.5">
                  {leadsColuna.length}
                </span>
              </div>
              <div className="bg-surface-container-low rounded-xl p-2 flex-1 space-y-2 min-h-[200px]">
                {leadsColuna.map((lead) => {
                  const inativo = horasDesde(lead.atualizado_em) > 48;
                  const responsavel = Array.isArray(lead.users)
                    ? lead.users[0]
                    : lead.users;
                  return (
                    <div
                      key={lead.id}
                      className={
                        inativo
                          ? "bg-amber-50 border border-amber-300 rounded-lg p-3 shadow-sm"
                          : "bg-white border border-outline-variant rounded-lg p-3 shadow-sm"
                      }
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase">
                          {lead.nicho}
                        </span>
                        {lead.prioridade && (
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 mt-1 ${PRIORIDADE_COR[lead.prioridade]}`}
                          />
                        )}
                      </div>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="block font-semibold text-sm text-on-surface mt-2 hover:underline"
                      >
                        {lead.nome}
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-on-surface-variant">
                          {isAdmin ? responsavel?.nome ?? "—" : null}
                        </span>
                        <span
                          className={`text-xs ${inativo ? "text-amber-700 font-semibold" : "text-on-surface-variant"}`}
                        >
                          {tempoParado(lead.atualizado_em)}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {STATUS_LEAD.indexOf(status) > 0 && (
                          <button
                            disabled={pending}
                            onClick={() => moverStatus(lead.id, status, -1)}
                            className="flex-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded py-1 transition-colors disabled:opacity-50"
                          >
                            ← Voltar
                          </button>
                        )}
                        {STATUS_LEAD.indexOf(status) < STATUS_LEAD.length - 1 && (
                          <button
                            disabled={pending}
                            onClick={() => moverStatus(lead.id, status, 1)}
                            className="flex-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded py-1 transition-colors disabled:opacity-50"
                          >
                            Avançar →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {leadsColuna.length === 0 && (
                  <p className="text-xs text-on-surface-variant text-center py-6">
                    Nenhum lead aqui
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
