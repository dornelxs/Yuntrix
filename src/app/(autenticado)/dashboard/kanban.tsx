"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
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
  dataSelecionada: string;
  hoje: string;
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

export function Kanban({
  leadsIniciais,
  nichos,
  funcionarios,
  isAdmin,
  dataSelecionada,
  hoje,
}: KanbanProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Cópia local dos leads para mover de forma otimista (drag e botões).
  // Ressincroniza sem useEffect: quando o servidor manda uma nova referência
  // de leadsIniciais (filtro/refresh), ajusta o estado durante o render.
  const [leads, setLeads] = useState(leadsIniciais);
  const [origem, setOrigem] = useState(leadsIniciais);
  if (origem !== leadsIniciais) {
    setOrigem(leadsIniciais);
    setLeads(leadsIniciais);
  }

  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusLead | null>(null);

  function aplicarFiltro(chave: string, valor: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (valor) sp.set(chave, valor);
    else sp.delete(chave);
    router.push(`/dashboard?${sp.toString()}`);
  }

  function rotuloData(ymd: string): string {
    const [ano, mes, dia] = ymd.split("-").map(Number);
    return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  }

  const isHoje = dataSelecionada === hoje;

  // Move um lead para um status alvo, de forma otimista. Reverte se falhar.
  function moverPara(leadId: string, novoStatus: StatusLead) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === novoStatus) return;

    const statusAnterior = lead.status;
    setLeads((atual) =>
      atual.map((l) =>
        l.id === leadId
          ? { ...l, status: novoStatus, atualizado_em: new Date().toISOString() }
          : l
      )
    );

    startTransition(async () => {
      const resultado = await atualizarStatusLead(leadId, novoStatus);
      if (resultado?.erro) {
        // Reverte a mudança otimista e avisa.
        setLeads((atual) =>
          atual.map((l) => (l.id === leadId ? { ...l, status: statusAnterior } : l))
        );
        alert(resultado.erro);
      } else {
        router.refresh();
      }
    });
  }

  function moverStatus(leadId: string, atual: StatusLead, direcao: 1 | -1) {
    const indice = STATUS_LEAD.indexOf(atual);
    const novoIndice = indice + direcao;
    if (novoIndice < 0 || novoIndice >= STATUS_LEAD.length) return;
    moverPara(leadId, STATUS_LEAD[novoIndice]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            calendar_today
          </span>
          <input
            type="date"
            value={dataSelecionada}
            max={hoje}
            onChange={(e) => aplicarFiltro("data", e.target.value)}
            className="input bg-surface-container-lowest w-auto"
          />
          {!isHoje && (
            <button
              onClick={() => aplicarFiltro("data", "")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Hoje
            </button>
          )}
        </div>

        <select
          className="input bg-surface-container-lowest w-auto"
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
            className="input bg-surface-container-lowest w-auto"
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

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface-variant">
        <span>
          Mostrando leads importados{" "}
          <span className="font-semibold text-on-surface">
            {isHoje ? "hoje" : `em ${rotuloData(dataSelecionada)}`}
          </span>{" "}
          · {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </span>
        <span className="hidden lg:inline-flex items-center gap-1 text-xs text-on-surface-variant/80">
          <span className="material-symbols-outlined text-sm">drag_indicator</span>
          Arraste os cards entre as colunas
        </span>
      </div>

      <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto pb-2 -mx-4 lg:mx-0 snap-x snap-mandatory lg:snap-none">
        {STATUS_LEAD.map((status) => {
          const leadsColuna = leads.filter((l) => l.status === status);
          const alvo = colunaAlvo === status && arrastandoId !== null;
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
              <div
                onDragOver={(e) => {
                  if (!arrastandoId) return;
                  e.preventDefault();
                  setColunaAlvo(status);
                }}
                onDragLeave={(e) => {
                  // Só limpa se realmente saiu da coluna (não de um filho).
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setColunaAlvo((atual) => (atual === status ? null : atual));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (arrastandoId) moverPara(arrastandoId, status);
                  setArrastandoId(null);
                  setColunaAlvo(null);
                }}
                className={`rounded-xl p-2 flex-1 space-y-2 min-h-[200px] transition-colors ${
                  alvo
                    ? "bg-primary/10 ring-2 ring-primary/40 ring-inset"
                    : "bg-surface-container-low"
                }`}
              >
                {leadsColuna.map((lead) => {
                  const inativo = horasDesde(lead.atualizado_em) > 48;
                  const responsavel = Array.isArray(lead.users)
                    ? lead.users[0]
                    : lead.users;
                  const arrastando = arrastandoId === lead.id;
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        setArrastandoId(lead.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", lead.id);
                      }}
                      onDragEnd={() => {
                        setArrastandoId(null);
                        setColunaAlvo(null);
                      }}
                      className={`${
                        inativo
                          ? "bg-amber-400/10 border border-amber-400/50 hover:border-amber-400"
                          : "bg-surface-container-lowest border border-outline-variant hover:border-outline"
                      } rounded-lg p-3 shadow-sm transition-all hover:shadow-md lg:cursor-grab lg:active:cursor-grabbing ${
                        arrastando ? "opacity-40 ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="inline-block px-2 py-0.5 bg-primary/15 text-primary border border-primary/25 text-[10px] font-bold rounded-md uppercase leading-tight">
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
                        draggable={false}
                        className="block font-semibold text-sm text-on-surface mt-2 hover:underline"
                      >
                        {lead.nome}
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-on-surface-variant">
                          {isAdmin ? responsavel?.nome ?? "—" : null}
                        </span>
                        <span
                          className={`text-xs ${inativo ? "text-amber-400 font-semibold" : "text-on-surface-variant"}`}
                        >
                          {tempoParado(lead.atualizado_em)}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {STATUS_LEAD.indexOf(status) > 0 && (
                          <button
                            disabled={pending}
                            onClick={() => moverStatus(lead.id, status, -1)}
                            className="flex-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded py-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                          >
                            ← Voltar
                          </button>
                        )}
                        {STATUS_LEAD.indexOf(status) < STATUS_LEAD.length - 1 && (
                          <button
                            disabled={pending}
                            onClick={() => moverStatus(lead.id, status, 1)}
                            className="flex-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded py-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
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
                    {alvo ? "Solte aqui" : "Nenhum lead aqui"}
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
