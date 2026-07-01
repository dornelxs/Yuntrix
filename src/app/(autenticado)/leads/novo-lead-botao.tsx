"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { criarLeadAvulso, type NovoLeadState } from "./novo-lead-actions";

const estadoInicial: NovoLeadState = {};

export function NovoLeadBotao({
  nichos,
  funcionarios,
  isAdmin,
}: {
  nichos: string[];
  funcionarios: { id: string; nome: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [state, formAction, pending] = useActionState(criarLeadAvulso, estadoInicial);

  useEffect(() => {
    if (state.sucesso) {
      setModalAberto(false);
      router.refresh();
    }
  }, [state.sucesso, router]);

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all text-sm"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Novo Lead
      </button>

      {modalAberto && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-10 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg my-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Novo lead</h3>
              <button onClick={() => setModalAberto(false)} aria-label="Fechar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Nome *
                </label>
                <input
                  name="nome"
                  required
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Nicho *
                </label>
                <input
                  name="nicho"
                  list="nichos-existentes"
                  required
                  placeholder="Ex: Psicólogos"
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
                <datalist id="nichos-existentes">
                  {nichos.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Telefone
                </label>
                <input
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Instagram
                </label>
                <input
                  name="instagram"
                  placeholder="@usuario"
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <p className="text-xs text-on-surface-variant -mt-2">
                Informe telefone ou Instagram (ao menos um).
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Especialidade
                </label>
                <input
                  name="especialidade"
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Ponto de dor
                </label>
                <textarea
                  name="pontoDeDor"
                  rows={2}
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none resize-none"
                />
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Atribuir para *
                  </label>
                  <select
                    name="atribuidoA"
                    required
                    className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  >
                    <option value="">Selecione...</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {state.erro && <p className="text-sm text-error">{state.erro}</p>}

              <button
                type="submit"
                disabled={pending}
                className="bg-primary text-on-primary font-semibold rounded-lg py-2.5 disabled:opacity-60"
              >
                {pending ? "Criando..." : "Criar lead"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
