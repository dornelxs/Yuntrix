import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  calcularIntervalo,
  buscarVisaoGeral,
  buscarConversaoPorNicho,
  buscarPerformancePorFuncionario,
  buscarLotesImportacao,
  buscarAtividadeDiaria,
  buscarVisaoFinanceira,
  type Periodo,
} from "./data";
import { RelatoriosCliente } from "./relatorios-cliente";

interface RelatoriosPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") redirect("/dashboard");

  const periodo = (params.periodo as Periodo) ?? "mensal";
  const { inicio, fim } = calcularIntervalo(periodo, params.inicio, params.fim);

  const [visaoGeral, conversaoPorNicho, performanceFuncionarios, lotes, atividadeDiaria, financeiro] =
    await Promise.all([
      buscarVisaoGeral(inicio, fim),
      buscarConversaoPorNicho(inicio, fim),
      buscarPerformancePorFuncionario(inicio, fim),
      buscarLotesImportacao(inicio, fim),
      buscarAtividadeDiaria(inicio, fim),
      buscarVisaoFinanceira(inicio, fim),
    ]);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Relatórios</h2>
          <p className="text-sm text-on-surface-variant">
            Análise detalhada de performance e conversão da operação
          </p>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full min-w-0">
        <RelatoriosCliente
          periodo={periodo}
          intervalo={{ inicio, fim }}
          visaoGeral={visaoGeral}
          conversaoPorNicho={conversaoPorNicho}
          performanceFuncionarios={performanceFuncionarios}
          lotes={lotes}
          atividadeDiaria={atividadeDiaria}
          financeiro={financeiro}
        />
      </div>
    </div>
  );
}
