import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FinanceiroCliente } from "./financeiro-cliente";

interface FinanceiroPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function inicioSemana(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function inicioMes(mesOffset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - mesOffset, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function FinanceiroPage({ searchParams }: FinanceiroPageProps) {
  const params = await searchParams;
  const periodo = params.periodo === "mensal" ? "mensal" : "semanal";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const inicioPeriodo = periodo === "semanal" ? inicioSemana() : inicioMes();

  const [{ data: leadsFechados }, { data: configComissao }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, nome, valor_negociado, atualizado_em")
      .eq("atribuido_a", user.id)
      .eq("status", "fechado")
      .gte("atualizado_em", inicioPeriodo)
      .order("atualizado_em", { ascending: false }),
    supabase.from("configuracoes").select("valor").eq("chave", "percentual_comissao").single(),
  ]);

  const percentualComissao = parseFloat(configComissao?.valor ?? "0");
  const valorTotalVendas = (leadsFechados ?? []).reduce(
    (soma, l) => soma + (l.valor_negociado ?? 0),
    0
  );
  const comissaoTotal = valorTotalVendas * (percentualComissao / 100);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Financeiro</h2>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <FinanceiroCliente
          periodo={periodo}
          financeiro={{
            percentualComissao,
            valorTotalVendas,
            comissaoTotal,
            vendas: (leadsFechados ?? []).map((l) => ({
              nome: l.nome,
              valor: l.valor_negociado,
              data: l.atualizado_em,
            })),
          }}
        />
      </div>
    </div>
  );
}
