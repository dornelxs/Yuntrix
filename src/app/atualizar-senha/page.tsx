"use client";

import { useActionState } from "react";
import { atualizarSenha, type AtualizarSenhaState } from "./actions";

const initialState: AtualizarSenhaState = {};

export default function AtualizarSenhaPage() {
  const [state, formAction, pending] = useActionState(
    atualizarSenha,
    initialState
  );

  return (
    <main className="flex flex-1 flex-col justify-center items-center px-6 bg-surface min-h-screen">
      <div className="w-full max-w-[400px] flex flex-col gap-stack-lg">
        <header className="flex flex-col gap-stack-xs mb-stack-md">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                dataset
              </span>
            </div>
            <h1 className="text-[20px] leading-7 font-semibold text-primary tracking-tight">
              Yuntrix
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant">Definir nova senha</p>
        </header>

        <form action={formAction} className="flex flex-col gap-stack-md">
          <div className="flex flex-col gap-stack-sm">
            <label
              className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
              htmlFor="novaSenha"
            >
              Nova senha
            </label>
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed transition-all duration-200"
              id="novaSenha"
              name="novaSenha"
              placeholder="Mínimo 8 caracteres"
              type="password"
              minLength={8}
              required
            />
          </div>

          {state?.erro && (
            <p className="text-sm text-error" role="alert">
              {state.erro}
            </p>
          )}

          <button
            className="mt-4 w-full py-3.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </main>
  );
}
