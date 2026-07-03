"use client";

import { useActionState } from "react";
import {
  atualizarPerfil,
  alterarSenha,
  type PerfilState,
  type SenhaState,
} from "./actions";

const perfilInicial: PerfilState = {};
const senhaInicial: SenhaState = {};

export function MinhaContaCliente({
  perfil,
}: {
  perfil: { nome: string; email: string; role: string };
}) {
  const [perfilState, perfilAction, perfilPending] = useActionState(atualizarPerfil, perfilInicial);
  const [senhaState, senhaAction, senhaPending] = useActionState(alterarSenha, senhaInicial);

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-on-surface">Informações pessoais</h3>
        <form action={perfilAction} className="space-y-4 max-w-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-on-surface-variant">
              Nome
            </label>
            <input
              name="nome"
              defaultValue={perfil.nome}
              className="input"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-on-surface-variant">
              E-mail
            </label>
            <input
              disabled
              value={perfil.email}
              className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant"
            />
          </div>
          {perfilState.erro && <p className="text-sm text-error">{perfilState.erro}</p>}
          {perfilState.sucesso && <p className="text-sm text-green-400">Alterações salvas.</p>}
          <button
            type="submit"
            disabled={perfilPending}
            className="btn btn-primary"
          >
            {perfilPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-on-surface">Segurança</h3>
        <form action={senhaAction} className="space-y-4 max-w-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-on-surface-variant">
              Nova senha
            </label>
            <input
              name="novaSenha"
              type="password"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="input"
            />
          </div>
          {senhaState.erro && <p className="text-sm text-error">{senhaState.erro}</p>}
          {senhaState.sucesso && <p className="text-sm text-green-400">Senha alterada com sucesso.</p>}
          <button
            type="submit"
            disabled={senhaPending}
            className="btn btn-primary"
          >
            {senhaPending ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
