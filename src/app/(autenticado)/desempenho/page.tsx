import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { count: leadsAtribuidos } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("atribuido_a", user.id);

  const mudancasStatus = (atividades ?? []).filter((a) => a.tipo === "mudanca_status");
  const contatados = mudancasStatus.filter((a) => a.status_novo === "contatado").length;
  const interessados = mudancasStatus.filter((a) => a.status_novo === "interessado").length;
  const fechados = mudancasStatus.filter((a) => a.status_novo === "fechado").length;

  const { count: leadsInativos } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("atribuido_a", user.id)
    .lt("atualizado_em", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Meu desempenho</h2>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <DesempenhoCliente
          periodo={periodo}
          metricas={{
            leadsAtribuidos: leadsAtribuidos ?? 0,
            contatados,
            interessados,
            fechados,
            leadsInativos: leadsInativos ?? 0,
            taxaConversao: leadsAtribuidos ? (fechados / leadsAtribuidos) * 100 : 0,
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
