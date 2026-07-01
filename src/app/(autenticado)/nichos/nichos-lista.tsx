"use client";

import { useActionState, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { criarNicho, excluirNicho, type NichoState } from "./actions";

interface Nicho {
  id: string;
  nome: string;
  criado_em: string;
  totalLeads: number;
  totalLotes: number;
}

const estadoInicial: NichoState = {};

export function NichosLista({ nichos }: { nichos: Nicho[] }) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [state, formAction, pending] = useActionState(criarNicho, estadoInicial);
  const [, startTransition] = useTransition();

  if (state.sucesso && modalAberto) {
    setModalAberto(false);
  }

  function excluir(id: string, nome: string) {
    if (
      !confirm(
        `Excluir o nicho "${nome}"? Os leads já importados não serão afetados, só deixarão de aparecer no dropdown de novos nichos.`
      )
    )
      return;
    startTransition(async () => {
      const resultado = await excluirNicho(id);
      if (resultado.erro) alert(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setModalAberto(true)}
          className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Novo nicho
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nichos.map((n) => (
          <div
            key={n.id}
            className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase">
                {n.nome}
              </span>
              <button
                onClick={() => excluir(n.id, n.nome)}
                aria-label="Excluir nicho"
                className="text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
            <div className="mt-4 space-y-1 text-sm text-on-surface-variant">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">group</span>
                {n.totalLeads} leads importados
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">description</span>
                {n.totalLotes} planilhas
              </p>
            </div>
          </div>
        ))}

        <button
          onClick={() => setModalAberto(true)}
          className="border-2 border-dashed border-outline-variant rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-colors min-h-[140px]"
        >
          <span className="material-symbols-outlined text-3xl">add_circle</span>
          <span className="text-sm font-semibold">Adicionar nicho</span>
        </button>
      </div>

      {modalAberto && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-10 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg my-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Novo nicho</h3>
              <button onClick={() => setModalAberto(false)} aria-label="Fechar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Nome do nicho
                </label>
                <input
                  name="nome"
                  required
                  placeholder="Ex: Fisioterapeutas"
                  className="border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>
              {state.erro && <p className="text-sm text-error">{state.erro}</p>}
              <button
                type="submit"
                disabled={pending}
                className="bg-primary text-on-primary font-semibold rounded-lg py-2.5 disabled:opacity-60"
              >
                {pending ? "Criando..." : "Criar nicho"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
