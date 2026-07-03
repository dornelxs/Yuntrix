"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { STATUS_LEAD, STATUS_LABEL } from "@/lib/status-lead";
import {
  criarResposta,
  editarResposta,
  excluirResposta,
  type RespostaState,
} from "./actions";
import type { Resposta } from "./page";

const estadoInicial: RespostaState = {};

// Cor de post-it por etapa do funil (fundo suave + borda), fiel aos tokens.
const COR_POST_IT: Record<string, string> = {
  sem_contato: "bg-surface-container-high border-outline-variant",
  contatado: "bg-secondary-container/50 border-secondary-container",
  interessado: "bg-tertiary-fixed/40 border-tertiary-fixed",
  fechado: "bg-green-50 border-green-200",
  sem_interesse: "bg-error-container/40 border-error-container",
};
const COR_POST_IT_SEM_STATUS = "bg-yellow-50 border-yellow-200";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RespostasLista({
  respostas,
  usuarioId,
  isAdmin,
}: {
  respostas: Resposta[];
  usuarioId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Resposta | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Uma action única que decide entre criar/editar pela presença de `id`
  // no FormData — evita re-vincular o useActionState ao alternar de modo.
  const [state, formAction, pending] = useActionState(
    async (prev: RespostaState, formData: FormData) =>
      formData.get("id")
        ? editarResposta(prev, formData)
        : criarResposta(prev, formData),
    estadoInicial
  );

  // Fecha o modal quando UMA nova execução da action retorna sucesso.
  // Padrão React "ajustar estado durante o render": guarda o último objeto
  // `state` já tratado num useState e compara identidade — cada dispatch
  // cria um novo objeto, então só fecha na transição (não fecha um modal
  // reaberto que ainda carrega o `sucesso` da operação anterior).
  const [stateTratado, setStateTratado] = useState<RespostaState | null>(null);
  if (state.sucesso && state !== stateTratado) {
    setStateTratado(state);
    setModalAberto(false);
    setEmEdicao(null);
  }

  const filtradas = useMemo(() => {
    if (filtroStatus === "todos") return respostas;
    if (filtroStatus === "sem_status")
      return respostas.filter((r) => !r.status_relacionado);
    return respostas.filter((r) => r.status_relacionado === filtroStatus);
  }, [respostas, filtroStatus]);

  function abrirNova() {
    setEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(r: Resposta) {
    setEmEdicao(r);
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEmEdicao(null);
  }

  function podeGerenciar(r: Resposta): boolean {
    return isAdmin || r.criado_por === usuarioId;
  }

  async function copiar(r: Resposta) {
    try {
      await navigator.clipboard.writeText(r.conteudo);
      setCopiadoId(r.id);
      setTimeout(() => setCopiadoId((atual) => (atual === r.id ? null : atual)), 1500);
    } catch {
      alert("Não foi possível copiar. Copie o texto manualmente.");
    }
  }

  function excluir(r: Resposta) {
    if (!confirm(`Excluir a resposta "${r.titulo}"?`)) return;
    startTransition(async () => {
      const resultado = await excluirResposta(r.id);
      if (resultado.erro) alert(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra: filtro + novo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase text-on-surface-variant">
            Etapa
          </span>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="input bg-surface-container-lowest"
          >
            <option value="todos">Todas</option>
            <option value="sem_status">Sem etapa</option>
            {STATUS_LEAD.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={abrirNova}
          className="btn btn-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova resposta
        </button>
      </div>

      {/* Grid de post-its */}
      {filtradas.length === 0 ? (
        <div className="border-2 border-dashed border-outline-variant rounded-2xl p-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl">sticky_note_2</span>
          <p className="text-sm font-semibold">Nenhuma resposta por aqui ainda</p>
          <button
            onClick={abrirNova}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Criar a primeira
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((r) => {
            const cor = r.status_relacionado
              ? COR_POST_IT[r.status_relacionado]
              : COR_POST_IT_SEM_STATUS;
            const gerenciavel = podeGerenciar(r);
            return (
              <div
                key={r.id}
                className={`${cor} border rounded-2xl p-5 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-on-surface leading-snug">{r.titulo}</h3>
                  <button
                    onClick={() => copiar(r)}
                    aria-label="Copiar resposta"
                    className={`btn-icon shrink-0 p-1.5 ${copiadoId === r.id ? "text-green-600" : "hover:text-primary"}`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copiadoId === r.id ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>

                <p className="text-sm text-on-surface whitespace-pre-wrap break-words">
                  {r.conteudo}
                </p>

                <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-[11px] text-on-surface-variant border-t border-black/5">
                  <div className="flex items-center gap-1 min-w-0">
                    {r.status_relacionado && (
                      <span className="px-2 py-0.5 rounded-full bg-black/5 font-semibold uppercase tracking-wide shrink-0">
                        {STATUS_LABEL[r.status_relacionado]}
                      </span>
                    )}
                    <span className="truncate">
                      {r.autorNome ?? "—"} · {formatarData(r.atualizado_em)}
                    </span>
                  </div>

                  {gerenciavel && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => abrirEdicao(r)}
                        aria-label="Editar"
                        className="btn-icon p-1.5 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => excluir(r)}
                        aria-label="Excluir"
                        className="btn-icon p-1.5 hover:text-error hover:bg-error-container/50"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalAberto &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 px-4 py-10 overflow-y-auto">
            <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg shadow-lg my-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-on-surface">
                  {emEdicao ? "Editar resposta" : "Nova resposta"}
                </h3>
                <button onClick={fechar} aria-label="Fechar" className="btn-icon">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form action={formAction} className="flex flex-col gap-4">
                {emEdicao && <input type="hidden" name="id" value={emEdicao.id} />}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Situação
                  </label>
                  <input
                    name="titulo"
                    required
                    defaultValue={emEdicao?.titulo ?? ""}
                    placeholder="Ex: Cliente respondeu que vai pensar"
                    className="input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Etapa do funil (opcional)
                  </label>
                  <select
                    name="statusRelacionado"
                    defaultValue={emEdicao?.status_relacionado ?? ""}
                    className="input bg-surface-container-lowest"
                  >
                    <option value="">Sem etapa específica</option>
                    {STATUS_LEAD.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Texto da resposta
                  </label>
                  <textarea
                    name="conteudo"
                    required
                    rows={6}
                    defaultValue={emEdicao?.conteudo ?? ""}
                    placeholder="O texto que você envia nessa situação..."
                    className="input resize-y"
                  />
                </div>

                {state.erro && <p className="text-sm text-error">{state.erro}</p>}

                <button
                  type="submit"
                  disabled={pending}
                  className="btn btn-primary w-full"
                >
                  {pending
                    ? "Salvando..."
                    : emEdicao
                      ? "Salvar alterações"
                      : "Criar resposta"}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
