"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  gerarPreview,
  confirmarImportacao,
  type PreviewState,
  type ConfirmarImportacaoState,
} from "./actions";
import type { LeadImportado } from "@/lib/parser-planilha";

interface ImportarFormProps {
  funcionarios: { id: string; nome: string }[];
  nichos: string[];
}

const previewInicial: PreviewState = {};
const confirmacaoInicial: ConfirmarImportacaoState = {};

export function ImportarForm({ funcionarios, nichos }: ImportarFormProps) {
  const [previewState, previewAction, previewPending] = useActionState(
    gerarPreview,
    previewInicial
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmarImportacao,
    confirmacaoInicial
  );

  const [leads, setLeads] = useState<LeadImportado[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [nicho, setNicho] = useState(nichos[0] ?? "__novo__");
  const [novoNicho, setNovoNicho] = useState("");
  const [dataProspeccao, setDataProspeccao] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [atribuidoA, setAtribuidoA] = useState(funcionarios[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (previewState.leads) {
      setLeads(previewState.leads);
      setSelecionados(
        new Set(
          previewState.leads
            .map((l, i) => (l.valido ? i : -1))
            .filter((i) => i !== -1)
        )
      );
    }
  }, [previewState.leads]);

  useEffect(() => {
    if (!confirmState.sucesso) return;
    const timer = setTimeout(() => {
      setLeads(null);
      formRef.current?.reset();
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmState.sucesso]);

  function alternarSelecao(indice: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(indice)) novo.delete(indice);
      else novo.add(indice);
      return novo;
    });
  }

  function limparTudo() {
    setSelecionados(new Set());
  }

  const nichoFinal = nicho === "__novo__" ? novoNicho : nicho;
  const leadsParaEnviar = (leads ?? []).map((l, i) => ({
    ...l,
    valido: l.valido && selecionados.has(i),
  }));
  const totalSelecionado = selecionados.size;

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Coluna esquerda: configurações */}
      <section className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-6 shadow-sm">
          <h4 className="text-lg font-semibold text-on-surface border-b border-outline-variant pb-4">
            Configurações
          </h4>

          <form ref={formRef} action={previewAction} className="space-y-4">
            <label className="border-2 border-dashed border-outline-variant rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-4xl text-outline">
                upload_file
              </span>
              <span className="text-sm text-on-surface font-semibold">
                Clique para subir ou arraste o arquivo
              </span>
              <span className="text-xs text-on-surface-variant">
                .csv, .xlsx ou .xls (Máx. 25MB)
              </span>
              <input
                type="file"
                name="arquivo"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    setLeads(null);
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </label>

            {previewState.erro && (
              <p className="text-sm text-error" role="alert">
                {previewState.erro}
              </p>
            )}
            {previewPending && (
              <p className="text-sm text-on-surface-variant">Processando arquivo...</p>
            )}
          </form>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Nicho do Lead
              </label>
              <select
                className="input bg-surface"
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
              >
                {nichos.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="__novo__">+ Novo nicho</option>
              </select>
              {nicho === "__novo__" && (
                <input
                  className="input bg-surface"
                  placeholder="Nome do novo nicho"
                  value={novoNicho}
                  onChange={(e) => setNovoNicho(e.target.value)}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Data de Prospecção
              </label>
              <input
                type="date"
                className="input bg-surface"
                value={dataProspeccao}
                onChange={(e) => setDataProspeccao(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Atribuir Leads para
              </label>
              <select
                className="input bg-surface"
                value={atribuidoA}
                onChange={(e) => setAtribuidoA(e.target.value)}
              >
                {funcionarios.length === 0 && (
                  <option value="">Nenhum funcionário cadastrado</option>
                )}
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Coluna direita: preview */}
      <section className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-surface border-b border-outline-variant flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-semibold text-on-surface">Preview dos Dados</h3>
              <p className="text-sm text-on-surface-variant">
                {leads
                  ? `Identificamos ${leads.length} linhas, ${totalSelecionado} selecionadas.`
                  : "Envie um arquivo para ver o preview."}
              </p>
            </div>
            {leads && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={limparTudo}
                  className="btn btn-secondary"
                >
                  Limpar Tudo
                </button>
                <form action={confirmAction}>
                  <input type="hidden" name="nicho" value={nichoFinal} />
                  <input type="hidden" name="dataProspeccao" value={dataProspeccao} />
                  <input type="hidden" name="atribuidoA" value={atribuidoA} />
                  <input type="hidden" name="nomeArquivo" value={previewState.nomeArquivo} />
                  <input
                    type="hidden"
                    name="leads"
                    value={JSON.stringify(leadsParaEnviar)}
                  />
                  <button
                    type="submit"
                    disabled={
                      confirmPending || totalSelecionado === 0 || !nichoFinal || !atribuidoA
                    }
                    className="btn btn-primary"
                  >
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    {confirmPending
                      ? "Importando..."
                      : `Importar e atribuir (${totalSelecionado})`}
                  </button>
                </form>
              </div>
            )}
          </div>

          {confirmState.erro && (
            <p className="px-6 py-3 text-sm text-error bg-error-container" role="alert">
              {confirmState.erro}
            </p>
          )}
          {confirmState.sucesso && (
            <p className="px-6 py-3 text-sm text-on-surface bg-surface-container-high" role="status">
              {confirmState.totalImportado} leads importados com sucesso.
              {confirmState.puladosPorDuplicata
                ? ` ${confirmState.puladosPorDuplicata} pulados por já existirem (duplicados).`
                : ""}
            </p>
          )}

          {leads && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low z-10">
                  <tr>
                    <th className="px-6 py-3 border-b border-outline-variant w-12"></th>
                    <th className="px-6 py-3 border-b border-outline-variant text-xs font-semibold uppercase text-on-surface-variant">
                      Nome
                    </th>
                    <th className="px-6 py-3 border-b border-outline-variant text-xs font-semibold uppercase text-on-surface-variant">
                      Especialidade
                    </th>
                    <th className="px-6 py-3 border-b border-outline-variant text-xs font-semibold uppercase text-on-surface-variant">
                      Telefone
                    </th>
                    <th className="px-6 py-3 border-b border-outline-variant text-xs font-semibold uppercase text-on-surface-variant">
                      Ponto de dor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest">
                  {leads.map((lead, i) => (
                    <tr
                      key={i}
                      className={
                        lead.valido
                          ? "hover:bg-surface transition-colors"
                          : "bg-error-container/30 text-on-surface-variant"
                      }
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-outline-variant text-primary"
                          checked={selecionados.has(i)}
                          disabled={!lead.valido}
                          onChange={() => alternarSelecao(i)}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                        {lead.valido ? lead.nome : lead.motivoInvalido}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {lead.especialidade ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {lead.telefone ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant italic">
                        {lead.pontoDeDor ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
