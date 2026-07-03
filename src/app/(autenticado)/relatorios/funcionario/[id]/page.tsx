import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcularIntervalo, buscarVendasFuncionario, type Periodo } from "../../data";

interface FuncionarioDetalhePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FuncionarioDetalhePage({
  params,
  searchParams,
}: FuncionarioDetalhePageProps) {
  const { id } = await params;
  const sp = await searchParams;
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

  const periodo = (sp.periodo as Periodo) ?? "mensal";
  const { inicio, fim } = calcularIntervalo(periodo);
  const dados = await buscarVendasFuncionario(id, inicio, fim);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <Link href="/relatorios" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{dados.funcionario.nome}</h2>
            <p className="text-sm text-on-surface-variant">{dados.funcionario.email}</p>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase text-on-surface-variant mb-1">
              Total vendido
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatarMoeda(dados.valorTotalVendas)}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase text-on-surface-variant mb-1">
              Comissão ({dados.percentualComissao}%)
            </p>
            <p className="text-2xl font-bold text-green-400">
              {formatarMoeda(dados.comissaoTotal)}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase text-on-surface-variant mb-1">
              Vendas fechadas
            </p>
            <p className="text-2xl font-bold text-on-surface">{dados.vendas.length}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-3">Vendas no período</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                    Lead
                  </th>
                  <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                    Nicho
                  </th>
                  <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                    Valor
                  </th>
                  <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {dados.vendas.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 text-sm font-semibold text-on-surface">
                      <Link href={`/leads/${v.id}`} className="hover:underline">
                        {v.nome}
                      </Link>
                    </td>
                    <td className="py-3 text-sm">{v.nicho}</td>
                    <td className="py-3 text-sm">
                      {v.valor != null ? formatarMoeda(v.valor) : "Não informado"}
                    </td>
                    <td className="py-3 text-sm text-on-surface-variant">
                      {new Date(v.data).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
                {dados.vendas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-on-surface-variant">
                      Nenhuma venda no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
