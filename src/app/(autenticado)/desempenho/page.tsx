import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularFunil } from "@/lib/metricas";
import { DesempenhoCliente } from "./desempenho-cliente";

interface DesempenhoPageProps {
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

export default async function DesempenhoPage({ searchParams }: DesempenhoPageProps) {
  const params = await searchParams;
  const periodo = params.periodo === "mensal" ? "mensal" : "semanal";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const inicioPeriodo = periodo === "semanal" ? inicioSemana() : inicioMes();

  const { data: atividades } = await supabase
    .from("lead_activities")
    .select("tipo, status_novo, criado_em, lead_id, leads:lead_id(nome, criado_em)")
    .eq("user_id", user.id)
    .gte("criado_em", inicioPeriodo)
    .order("criado_em", { ascending: false });

  // Coorte: os leads do usuário que entraram no período. O funil sai do
  // status ATUAL deles (ver lib/metricas.ts). Antes as conversões vinham de
  // eventos do período mas eram divididas por TODOS os leads já atribuídos —
  // janelas diferentes, taxa sempre distorcida.
  const { data: leadsDoPeriodo } = await supabase
    .from("leads")
    .select("status")
    .eq("atribuido_a", user.id)
    .gte("criado_em", inicioPeriodo);

  const funil = calcularFunil(leadsDoPeriodo ?? []);

  const { count: leadsInativos } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("atribuido_a", user.id)
    .lt("atualizado_em", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Meu desempenho</h2>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <DesempenhoCliente
          periodo={periodo}
          metricas={{
            leadsAtribuidos: funil.total,
            contatados: funil.contatados,
            interessados: funil.interessados,
            fechados: funil.fechados,
            leadsInativos: leadsInativos ?? 0,
            taxaConversao: funil.taxaConversao,
          }}
          atividadesRecentes={(atividades ?? []).slice(0, 20).map((a) => ({
            tipo: a.tipo,
            statusNovo: a.status_novo,
            criadoEm: a.criado_em,
            nomeLead: Array.isArray(a.leads) ? a.leads[0]?.nome : (a.leads as unknown as { nome: string } | null)?.nome,
          }))}
        />
      </div>
    </div>
  );
}
