"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className="flex min-h-screen items-stretch overflow-hidden">
      {/* Formulário (esquerda) */}
      <main className="flex flex-1 flex-col justify-center items-center px-6 lg:px-24 bg-surface z-10">
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
            <p className="text-sm text-on-surface-variant">CRM de Prospecção</p>
          </header>

          <form action={formAction} className="flex flex-col gap-stack-md">
            <div className="flex flex-col gap-stack-sm">
              <label
                className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                htmlFor="email"
              >
                E-mail Corporativo
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed transition-all duration-200"
                  id="email"
                  name="email"
                  placeholder="nome@empresa.com"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-stack-sm">
              <label
                className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                htmlFor="senha"
              >
                Senha
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed transition-all duration-200"
                  id="senha"
                  name="senha"
                  placeholder="Digite sua senha"
                  type={mostrarSenha ? "text" : "password"}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  onClick={() => setMostrarSenha((v) => !v)}
                  type="button"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <span className="material-symbols-outlined">
                    {mostrarSenha ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {state?.erro && (
              <p className="text-sm text-error" role="alert">
                {state.erro}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary-container"
                  type="checkbox"
                  name="lembrar"
                />
                <span className="text-[13px] text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Lembrar neste dispositivo
                </span>
              </label>
              <a
                className="text-xs font-semibold text-primary hover:underline transition-all"
                href="/recuperar-senha"
              >
                Esqueceu a senha?
              </a>
            </div>

            <button
              className="mt-4 w-full py-3.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              type="submit"
              disabled={pending}
            >
              {pending ? "Entrando..." : "Acessar Dashboard"}
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </form>

          <footer className="mt-stack-lg pt-stack-lg border-t border-outline-variant">
            <p className="text-[13px] text-on-surface-variant text-center">
              Não tem uma conta?{" "}
              <a className="font-bold text-primary hover:underline" href="#">
                Solicite acesso ao administrador
              </a>
            </p>
          </footer>
        </div>
      </main>

      {/* Branding (direita) */}
      <aside
        className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #004ac6 0%, #2563eb 50%, #505f76 100%)",
        }}
      >
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary-fixed-dim/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-tertiary-container/10 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div
            className="p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-transform hover:scale-105 duration-700"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <span
                className="material-symbols-outlined text-white text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                dataset
              </span>
            </div>
            <div className="text-center">
              <span className="text-[36px] leading-[44px] font-bold text-on-primary-container tracking-tighter">
                Yuntrix
              </span>
              <div className="h-1 w-12 bg-white/40 mx-auto mt-2 rounded-full" />
            </div>
          </div>

          <div className="text-center px-12 max-w-md">
            <h2 className="text-2xl text-on-primary-container font-semibold mb-2">
              Potencialize suas Vendas Outbound
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              A plataforma inteligente projetada para transformar dados de
              prospecção em fechamentos consistentes.
            </p>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 flex items-center gap-4">
          <span className="text-xs text-white/80">
            +2k empresas prospectando hoje
          </span>
        </div>
      </aside>
    </div>
  );
}
