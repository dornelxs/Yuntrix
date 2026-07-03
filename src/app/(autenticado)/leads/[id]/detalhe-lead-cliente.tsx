"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  STATUS_LEAD,
  STATUS_LABEL,
  type StatusLead,
} from "@/lib/status-lead";
import {
  atualizarStatusLead,
  adicionarNota,
  excluirNota,
  editarNota,
  registrarValorNegociado,
  type NotaState,
} from "./actions";

interface Atividade {
  id: string;
  tipo: "mudanca_status" | "nota";
  status_anterior: string | null;
  status_novo: string | null;
  nota_texto: string | null;
  criado_em: string;
  user_id: string;
  autor?: string;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  instagram: string | null;
  especialidade: string | null;
  nicho: string;
  ponto_de_dor: string | null;
  mensagem_1: string | null;
  mensagem_2: string | null;
  mensagem_3: string | null;
  status: string;
  atribuido_a: string | null;
  valor_negociado: number | null;
}

const ICONE_STATUS: Record<StatusLead, string> = {
  sem_contato: "block",
  contatado: "chat",
  interessado: "favorite",
  fechado: "check_circle",
  sem_interesse: "cancel",
};

function whatsappLink(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const comCodigoPais = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comCodigoPais}`;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const notaInicial: NotaState = {};

export function DetalheLeadCliente({
  lead,
  atividades,
  usuarioAtualId,
  isAdmin,
}: {
  lead: Lead;
  atividades: Atividade[];
  usuarioAtualId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [statusAtual, setStatusAtual] = useState(lead.status as StatusLead);
  const [pending, startTransition] = useTransition();
  const [copiado, setCopiado] = useState<string | null>(null);
  const [notaState, notaAction, notaPending] = useActionState(adicionarNota, notaInicial);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [valorNegociado, setValorNegociado] = useState(
    lead.valor_negociado?.toString() ?? ""
  );
  const [salvandoValor, setSalvandoValor] = useState(false);

  function salvarValor() {
    const numero = parseFloat(valorNegociado.replace(",", "."));
    setSalvandoValor(true);
    startTransition(async () => {
      const resultado = await registrarValorNegociado(lead.id, numero);
      setSalvandoValor(false);
      if (resultado.erro) {
        alert(resultado.erro);
      } else {
        router.refresh();
      }
    });
  }

  function iniciarEdicao(notaId: string, textoAtual: string) {
    setEditandoId(notaId);
    setTextoEdicao(textoAtual);
  }

  function salvarEdicao(notaId: string) {
    startTransition(async () => {
      const resultado = await editarNota(notaId, lead.id, textoEdicao);
      if (resultado.erro) {
        alert(resultado.erro);
      } else {
        setEditandoId(null);
        router.refresh();
      }
    });
  }

  function removerNota(notaId: string) {
    if (!confirm("Excluir esta nota?")) return;
    setExcluindoId(notaId);
    startTransition(async () => {
      const resultado = await excluirNota(notaId, lead.id);
      setExcluindoId(null);
      if (resultado.erro) {
        alert(resultado.erro);
      } else {
        router.refresh();
      }
    });
  }

  function mudarStatus(novo: StatusLead) {
    if (novo === statusAtual) return;
    const anterior = statusAtual;
    setStatusAtual(novo);
    startTransition(async () => {
      const resultado = await atualizarStatusLead(lead.id, novo);
      if (resultado.erro) {
        setStatusAtual(anterior);
        alert(resultado.erro);
      } else {
        router.refresh();
      }
    });
  }

  function copiar(texto: string, chave: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(chave);
    setTimeout(() => setCopiado(null), 2000);
  }

  const link = lead.telefone ? whatsappLink(lead.telefone) : null;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Voltar
        </button>
      </header>

      <div className="p-4 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-2xl font-bold shrink-0">
            {lead.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface">{lead.nome}</h1>
            <p className="text-sm text-on-surface-variant">
              {lead.especialidade ?? "—"} — Nicho:{" "}
              <span className="font-semibold text-primary">{lead.nicho}</span>
            </p>
            <div className="flex gap-2 mt-2">
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-green-500/15 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  WhatsApp
                </a>
              )}
              {lead.instagram && (
                <a
                  href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-pink-500/15 text-pink-400 rounded-full text-xs font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-xs font-semibold uppercase text-on-surface-variant mb-2">
            Status atual
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_LEAD.map((s) => (
              <button
                key={s}
                disabled={pending}
                onClick={() => mudarStatus(s)}
                className={
                  s === statusAtual
                    ? "border-2 border-primary bg-primary/10 rounded-lg p-4 flex flex-col items-center gap-1 text-primary font-semibold cursor-pointer transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                    : "border border-outline-variant rounded-lg p-4 flex flex-col items-center gap-1 text-on-surface-variant hover:border-primary hover:bg-primary/5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={s === statusAtual ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {ICONE_STATUS[s]}
                </span>
                <span className="text-sm">{STATUS_LABEL[s]}</span>
              </button>
            ))}
          </div>
        </section>

        {statusAtual === "fechado" && (
          <section className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase text-green-800 mb-2">
              Valor do negócio fechado
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorNegociado}
                  onChange={(e) => setValorNegociado(e.target.value)}
                  placeholder="0,00"
                  className="input pl-10"
                />
              </div>
              <button
                onClick={salvarValor}
                disabled={salvandoValor}
                className="btn btn-primary"
              >
                {salvandoValor ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </section>
        )}

        {lead.ponto_de_dor && (
          <section className="bg-surface-container-low rounded-xl p-4 border-l-4 border-primary">
            <h2 className="text-xs font-semibold uppercase text-primary mb-1">Ponto de dor</h2>
            <p className="text-sm text-on-surface italic">&ldquo;{lead.ponto_de_dor}&rdquo;</p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase text-on-surface-variant">
            Mensagens prontas
          </h2>
          {[
            { chave: "mensagem_1", titulo: "Primeiro contato", texto: lead.mensagem_1 },
            { chave: "mensagem_2", titulo: "Explicação do serviço", texto: lead.mensagem_2 },
            { chave: "mensagem_3", titulo: "Gancho de retenção", texto: lead.mensagem_3 },
          ]
            .filter((m) => m.texto)
            .map((m) => (
              <div
                key={m.chave}
                className="border border-outline-variant rounded-lg p-4 bg-surface-container-lowest"
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-on-surface">{m.titulo}</h3>
                  <button
                    onClick={() => copiar(m.texto!, m.chave)}
                    className={`btn-icon shrink-0 p-1.5 ${copiado === m.chave ? "text-green-600" : "text-primary hover:text-primary"}`}
                    aria-label="Copiar mensagem"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copiado === m.chave ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{m.texto}</p>
              </div>
            ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase text-on-surface-variant">
            Nova nota
          </h2>
          <form action={notaAction} className="flex flex-col gap-2">
            <input type="hidden" name="leadId" value={lead.id} />
            <textarea
              name="nota"
              rows={3}
              placeholder="Ex: Cliente pediu pra ligar semana que vem"
              className="input resize-none"
            />
            {notaState.erro && <p className="text-sm text-error">{notaState.erro}</p>}
            <button
              type="submit"
              disabled={notaPending}
              className="btn btn-primary self-end"
            >
              {notaPending ? "Salvando..." : "Salvar nota"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase text-on-surface-variant mb-3">
            Linha do tempo
          </h2>
          <ul className="space-y-3">
            {atividades.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">
                  {a.tipo === "nota" ? "sticky_note_2" : "swap_horiz"}
                </span>
                <div className="flex-1">
                  {a.tipo === "nota" ? (
                    editandoId === a.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={textoEdicao}
                          onChange={(e) => setTextoEdicao(e.target.value)}
                          rows={2}
                          className="input resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => salvarEdicao(a.id)}
                            disabled={pending}
                            className="btn btn-primary btn-sm"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="btn btn-ghost btn-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-on-surface">{a.nota_texto}</p>
                        {(a.user_id === usuarioAtualId || isAdmin) && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => iniciarEdicao(a.id, a.nota_texto ?? "")}
                              aria-label="Editar nota"
                              className="btn-icon p-1.5 hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => removerNota(a.id)}
                              disabled={excluindoId === a.id}
                              aria-label="Excluir nota"
                              className="btn-icon p-1.5 hover:text-error hover:bg-error-container/50 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-on-surface">
                      Status alterado de{" "}
                      <strong>
                        {STATUS_LABEL[a.status_anterior as StatusLead] ?? a.status_anterior}
                      </strong>{" "}
                      para{" "}
                      <strong>
                        {STATUS_LABEL[a.status_novo as StatusLead] ?? a.status_novo}
                      </strong>
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    {a.autor ?? "—"} · {formatarData(a.criado_em)}
                  </p>
                </div>
              </li>
            ))}
            {atividades.length === 0 && (
              <p className="text-sm text-on-surface-variant">Nenhuma atividade ainda.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
