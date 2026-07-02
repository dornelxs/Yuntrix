"use client";

import { useActionState, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  criarFuncionario,
  alternarAtivoFuncionario,
  excluirFuncionario,
  type CriarFuncionarioState,
} from "./actions";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  criado_em: string;
}

const estadoInicial: CriarFuncionarioState = {};

export function EquipeLista({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: Usuario[];
  usuarioAtualId: string;
}) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [state, formAction, pending] = useActionState(criarFuncionario, estadoInicial);
  const [, startTransition] = useTransition();

  if (state.sucesso && modalAberto) {
    setModalAberto(false);
  }

  function alternarAtivo(id: string, ativoAtual: boolean) {
    if (
      !confirm(
        ativoAtual
          ? "Desativar este funcionário? Ele não conseguirá mais fazer login."
          : "Reativar este funcionário?"
      )
    )
      return;
    startTransition(async () => {
      const resultado = await alternarAtivoFuncionario(id, !ativoAtual);
      if (resultado.erro) alert(resultado.erro);
      else router.refresh();
    });
  }

  function excluir(id: string, nome: string) {
    if (!confirm(`Excluir permanentemente "${nome}"? Essa ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const resultado = await excluirFuncionario(id);
      if (resultado.erro) alert(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setModalAberto(true)}
          className="btn btn-primary"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Adicionar funcionário
        </button>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">
                Nome
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">
                E-mail
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">
                Função
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-on-surface-variant text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-surface-container transition-colors">
                <td className="px-6 py-3 text-sm font-semibold text-on-surface">{u.nome}</td>
                <td className="px-6 py-3 text-sm text-on-surface-variant">{u.email}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 border border-outline-variant text-on-surface-variant text-[11px] font-bold rounded uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`flex items-center gap-1.5 text-sm ${u.ativo ? "text-green-700" : "text-on-surface-variant"}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${u.ativo ? "bg-green-500" : "bg-outline"}`}
                    />
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {u.id !== usuarioAtualId && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => alternarAtivo(u.id, u.ativo)}
                        className="btn btn-ghost btn-sm text-primary hover:text-primary"
                      >
                        {u.ativo ? "Desativar" : "Reativar"}
                      </button>
                      <button
                        onClick={() => excluir(u.id, u.nome)}
                        className="btn btn-danger btn-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-10 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg my-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Adicionar funcionário</h3>
              <button onClick={() => setModalAberto(false)} aria-label="Fechar" className="btn-icon">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Nome
                </label>
                <input
                  name="nome"
                  required
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  E-mail
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase text-on-surface-variant">
                  Senha provisória
                </label>
                <input
                  name="senha"
                  type="password"
                  required
                  minLength={8}
                  className="input"
                />
              </div>
              {state.erro && <p className="text-sm text-error">{state.erro}</p>}
              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary w-full"
              >
                {pending ? "Criando..." : "Criar acesso"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
