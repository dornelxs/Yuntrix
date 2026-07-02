"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { STATUS_LEAD, STATUS_LABEL, PRIORIDADE_LABEL } from "@/lib/status-lead";

interface LeadsFiltrosProps {
  nichos: string[];
  funcionarios: { id: string; nome: string }[];
  isAdmin: boolean;
  totalEncontrado: number;
}

const ROTULO_FILTRO: Record<string, string> = {
  status: "Status",
  nicho: "Nicho",
  prioridade: "Prioridade",
  responsavel: "Responsável",
  busca: "Busca",
};

export function LeadsFiltros({
  nichos,
  funcionarios,
  isAdmin,
  totalEncontrado,
}: LeadsFiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [nicho, setNicho] = useState(searchParams.get("nicho") ?? "");
  const [prioridade, setPrioridade] = useState(searchParams.get("prioridade") ?? "");
  const [responsavel, setResponsavel] = useState(searchParams.get("responsavel") ?? "");
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");

  function aplicarFiltros() {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (nicho) sp.set("nicho", nicho);
    if (prioridade) sp.set("prioridade", prioridade);
    if (isAdmin && responsavel) sp.set("responsavel", responsavel);
    if (busca) sp.set("busca", busca);
    router.push(`/leads?${sp.toString()}`);
  }

  function limparFiltros() {
    setStatus("");
    setNicho("");
    setPrioridade("");
    setResponsavel("");
    setBusca("");
    router.push("/leads");
  }

  const filtrosAtivos = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([k]) => k !== "pagina")
  );

  function removerFiltro(chave: string) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete(chave);
    sp.delete("pagina");
    router.push(`/leads?${sp.toString()}`);
  }

  const nomeFuncionario = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? id;

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input flex-1 bg-surface-container-low"
          placeholder="Buscar por nome, telefone ou Instagram"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end mt-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-on-surface-variant">
            Status
          </label>
          <select
            className="input bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            {STATUS_LEAD.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-on-surface-variant">
            Nicho
          </label>
          <select
            className="input bg-white"
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
          >
            <option value="">Todos os Nichos</option>
            {nichos.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-on-surface-variant">
            Prioridade
          </label>
          <select
            className="input bg-white"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(PRIORIDADE_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-on-surface-variant">
              Responsável
            </label>
            <select
              className="input bg-white"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
            >
              <option value="">Todos</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={aplicarFiltros}
            className="btn btn-primary flex-1"
          >
            Filtrar
          </button>
          <button
            onClick={limparFiltros}
            className="btn btn-danger"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant flex items-center flex-wrap gap-2">
        <span className="text-sm font-semibold text-on-surface-variant mr-2">
          {totalEncontrado} leads encontrados
        </span>
        {Object.entries(filtrosAtivos).map(([chave, valor]) => (
          <div
            key={chave}
            className="flex items-center gap-1.5 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-sm"
          >
            <span>
              {ROTULO_FILTRO[chave] ?? chave}:{" "}
              {chave === "responsavel" ? nomeFuncionario(valor) : valor}
            </span>
            <button
              onClick={() => removerFiltro(chave)}
              aria-label={`Remover filtro ${chave}`}
              className="btn-icon p-0.5 hover:bg-black/10"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
