"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alterarNichoLote, reatribuirLote, type LoteImportado } from "./actions";

function rotuloData(ymd: string): string {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function LotesLista({
  lotes,
  nichos,
  funcionarios,
  dataSelecionada,
  hoje,
}: {
  lotes: LoteImportado[];
  nichos: string[];
  funcionarios: { id: string; nome: string }[];
  dataSelecionada: string | null;
  hoje: string;
}) {
  const router = useRouter();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nichoTemp, setNichoTemp] = useState("");
  // Reatribuição do lote para outro funcionário (independente da edição de nicho).
  const [reatribuindoId, setReatribuindoId] = useState<string | null>(null);
  const [funcionarioTemp, setFuncionarioTemp] = useState("");
  const [pending, startTransition] = useTransition();

  const mostrandoTodos = dataSelecionada === null;

  function filtrarPorData(valor: string) {
    // valor "" limpa para hoje (default); usamos "todos" p/ ver tudo.
    router.push(valor ? `/importar?data=${valor}` : "/importar");
  }

  // Agrupa lotes por data de prospecção (mais recente primeiro).
  const porData = useMemo(() => {
    const mapa = new Map<string, LoteImportado[]>();
    for (const lote of lotes) {
      const chave = lote.data_prospeccao;
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(lote);
    }
    return Array.from(mapa.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [lotes]);

  function iniciarEdicao(lote: LoteImportado) {
    setEditandoId(lote.id);
    setNichoTemp(lote.nicho.trim());
  }

  function iniciarReatribuicao(lote: LoteImportado) {
    setReatribuindoId(lote.id);
    setFuncionarioTemp(lote.atribuidoA ?? "");
  }

  function cancelarReatribuicao() {
    setReatribuindoId(null);
    setFuncionarioTemp("");
  }

  function salvarReatribuicao(lote: LoteImportado) {
    if (!funcionarioTemp || funcionarioTemp === lote.atribuidoA) {
      cancelarReatribuicao();
      return;
    }
    const nomeDestino =
      funcionarios.find((f) => f.id === funcionarioTemp)?.nome ?? "outro funcionário";
    if (
      !confirm(
        `Passar esta planilha (${lote.total_leads} leads) para ${nomeDestino}? ` +
          `Todos os leads do lote mudam de responsável, mantendo status e histórico.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const r = await reatribuirLote(lote.id, funcionarioTemp);
      if (r.erro) {
        alert(r.erro);
        return;
      }
      cancelarReatribuicao();
      router.refresh();
    });
  }

  function cancelar() {
    setEditandoId(null);
    setNichoTemp("");
  }

  function salvar(lote: LoteImportado) {
    const novo = nichoTemp.trim();
    if (!novo || novo === lote.nicho.trim()) {
      cancelar();
      return;
    }
    startTransition(async () => {
      const r = await alterarNichoLote(lote.id, novo);
      if (r.erro) {
        alert(r.erro);
        return;
      }
      cancelar();
      router.refresh();
    });
  }

  const barraFiltro = (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-on-surface-variant text-xl">
          calendar_today
        </span>
        <input
          type="date"
          value={dataSelecionada ?? ""}
          max={hoje}
          onChange={(e) => filtrarPorData(e.target.value)}
          className="input bg-surface-container-lowest w-auto"
        />
      </div>
      <button
        onClick={() => filtrarPorData("todos")}
        className={
          mostrandoTodos
            ? "px-3 py-2 text-sm font-semibold rounded-lg bg-primary text-on-primary"
            : "px-3 py-2 text-sm font-semibold rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
        }
      >
        Todas as datas
      </button>
      {!mostrandoTodos && dataSelecionada !== hoje && (
        <button
          onClick={() => filtrarPorData("")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Hoje
        </button>
      )}
    </div>
  );

  if (lotes.length === 0) {
    return (
      <div>
        {barraFiltro}
        <div className="border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-3xl">folder_open</span>
          <p className="text-sm font-semibold">
            {mostrandoTodos
              ? "Nenhuma planilha importada ainda"
              : "Nenhuma planilha nesta data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {barraFiltro}
      {porData.map(([data, lotesDoDia]) => (
        <div key={data}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">
              calendar_today
            </span>
            <h3 className="text-sm font-bold text-on-surface capitalize">
              {rotuloData(data)}
            </h3>
            <span className="text-xs font-semibold bg-surface-container-high text-on-surface-variant rounded-full px-2 py-0.5">
              {lotesDoDia.length} {lotesDoDia.length === 1 ? "planilha" : "planilhas"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lotesDoDia.map((lote) => {
              const editando = editandoId === lote.id;
              return (
                <div
                  key={lote.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3">
                    {editando ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          autoFocus
                          value={nichoTemp}
                          onChange={(e) => setNichoTemp(e.target.value)}
                          disabled={pending}
                          className="input bg-surface-container-lowest py-1.5 w-auto"
                        >
                          {/* nicho atual sempre disponível, mesmo se não estiver na lista */}
                          {!nichos.includes(lote.nicho.trim()) && (
                            <option value={lote.nicho.trim()}>
                              {lote.nicho.trim()}
                            </option>
                          )}
                          {nichos.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => salvar(lote)}
                          disabled={pending}
                          className="btn btn-primary btn-sm"
                        >
                          {pending ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          onClick={cancelar}
                          disabled={pending}
                          className="btn btn-ghost btn-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase">
                          {lote.nicho.trim()}
                        </span>
                        <button
                          onClick={() => iniciarEdicao(lote)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                          Alterar nicho
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 text-sm text-on-surface-variant">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">group</span>
                      {lote.total_leads} leads
                    </p>
                    {reatribuindoId === lote.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="material-symbols-outlined text-base">person</span>
                        <select
                          autoFocus
                          value={funcionarioTemp}
                          onChange={(e) => setFuncionarioTemp(e.target.value)}
                          disabled={pending}
                          className="input bg-surface-container-lowest py-1.5 w-auto"
                        >
                          <option value="">Selecione...</option>
                          {funcionarios.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => salvarReatribuicao(lote)}
                          disabled={pending}
                          className="btn btn-primary btn-sm"
                        >
                          {pending ? "Movendo..." : "Mover"}
                        </button>
                        <button
                          onClick={cancelarReatribuicao}
                          disabled={pending}
                          className="btn btn-ghost btn-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="material-symbols-outlined text-base">person</span>
                        {lote.responsavelNome ?? "Sem responsável"}
                        <button
                          onClick={() => iniciarReatribuicao(lote)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-base">
                            swap_horiz
                          </span>
                          Reatribuir
                        </button>
                      </div>
                    )}
                    {lote.arquivo_origem && (
                      <p className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-base shrink-0">
                          description
                        </span>
                        <span className="truncate" title={lote.arquivo_origem}>
                          {lote.arquivo_origem}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
