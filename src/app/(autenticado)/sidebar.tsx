"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { sair } from "./logout-action";

interface SidebarProps {
  nome: string;
  role: string;
}

const ITENS_MENU = [
  { href: "/dashboard", label: "Dashboard", icone: "dashboard", apenasAdmin: false, apenasFuncionario: false },
  { href: "/leads", label: "Leads", icone: "person_search", apenasAdmin: false, apenasFuncionario: false },
  { href: "/respostas", label: "Respostas Prontas", icone: "sticky_note_2", apenasAdmin: false, apenasFuncionario: false },
  { href: "/desempenho", label: "Meu Desempenho", icone: "trending_up", apenasAdmin: false, apenasFuncionario: true },
  { href: "/financeiro", label: "Financeiro", icone: "payments", apenasAdmin: false, apenasFuncionario: true },
  { href: "/importar", label: "Importar Planilha", icone: "upload_file", apenasAdmin: true, apenasFuncionario: false },
  { href: "/relatorios", label: "Relatórios", icone: "bar_chart", apenasAdmin: true, apenasFuncionario: false },
  { href: "/equipe", label: "Equipe", icone: "groups", apenasAdmin: true, apenasFuncionario: false },
  { href: "/nichos", label: "Nichos", icone: "category", apenasAdmin: true, apenasFuncionario: false },
];

function ConteudoMenu({
  nome,
  role,
  onNavegar,
}: {
  nome: string;
  role: string;
  onNavegar?: () => void;
}) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  return (
    <>
      <div>
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold">
            Y
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">Yuntrix</h1>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
              CRM de Prospecção
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {ITENS_MENU.filter(
            (item) =>
              (!item.apenasAdmin || isAdmin) && (!item.apenasFuncionario || !isAdmin)
          ).map((item) => {
            const ativo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavegar}
                aria-current={ativo ? "page" : undefined}
                className={
                  ativo
                    ? "relative flex items-center px-6 py-3 text-primary font-bold bg-primary/10 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-primary transition-colors"
                    : "flex items-center px-6 py-3 text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-highest transition-colors"
                }
              >
                <span
                  className="material-symbols-outlined mr-3 text-xl transition-transform"
                  style={ativo ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icone}
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 space-y-1">
        <Link
          href="/minha-conta"
          onClick={onNavegar}
          className="p-3 rounded-xl bg-surface-container-highest/50 flex items-center gap-3 hover:bg-surface-container-highest active:scale-[0.98] transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold shrink-0">
            {nome.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-on-surface truncate">{nome}</p>
            <p className="text-[10px] text-on-surface-variant truncate capitalize">{role}</p>
          </div>
        </Link>
        <form action={sair}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest active:scale-[0.98] rounded-xl transition-all text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sair
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar({ nome, role }: SidebarProps) {
  const [drawerAberto, setDrawerAberto] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerAberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerAberto]);

  return (
    <>
      {/* Topbar mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-container-low border-b border-outline-variant flex items-center px-4 z-40">
        <button
          onClick={() => setDrawerAberto(true)}
          aria-label="Abrir menu"
          className="btn-icon text-on-surface -ml-2"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-on-primary font-bold text-xs">
            Y
          </div>
          <span className="font-bold text-primary text-sm">Yuntrix</span>
        </div>
      </header>

      {/* Sidebar fixa desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[240px] bg-surface-container-low border-r border-outline-variant flex-col justify-between py-6 z-50">
        <ConteudoMenu nome={nome} role={role} />
      </aside>

      {/* Drawer mobile */}
      {drawerAberto &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60"
              onClick={() => setDrawerAberto(false)}
            />
            <aside className="relative w-[260px] max-w-[80vw] h-full bg-surface-container-low flex flex-col justify-between py-6 shadow-xl">
              <button
                onClick={() => setDrawerAberto(false)}
                aria-label="Fechar menu"
                className="absolute top-4 right-4 text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <ConteudoMenu nome={nome} role={role} onNavegar={() => setDrawerAberto(false)} />
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
