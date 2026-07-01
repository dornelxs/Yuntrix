import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kanban } from "./kanban";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("users")
    .select("nome, role")
    .eq("id", user.id)
    .single();

  const isAdmin = perfil?.role === "admin";

  const [{ data: nichosRaw }, { data: funcionarios }] = await Promise.all([
    supabase.from("leads").select("nicho").not("nicho", "is", null),
    isAdmin
      ? supabase.from("users").select("id, nome").eq("role", "funcionario").order("nome")
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ]);
  const nichos = Array.from(new Set((nichosRaw ?? []).map((n) => n.nicho))).sort();

  let query = supabase
    .from("leads")
    .select(
      "id, nome, nicho, status, prioridade, atualizado_em, atribuido_a, users:atribuido_a(nome)"
    )
    .order("atualizado_em", { ascending: false });

  if (params.nicho) query = query.eq("nicho", params.nicho);
  if (isAdmin && params.responsavel) query = query.eq("atribuido_a", params.responsavel);

  const { data: leads } = await query;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">
            {isAdmin ? "Painel de Controle" : `Bom dia, ${perfil?.nome ?? ""}`}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAdmin
              ? "Acompanhe o desempenho da sua equipe em tempo real"
              : "Acompanhe seus leads em andamento"}
          </p>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full">
        <Kanban
          leadsIniciais={leads ?? []}
          nichos={nichos}
          funcionarios={funcionarios ?? []}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
