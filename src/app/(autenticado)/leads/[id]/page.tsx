import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetalheLeadCliente } from "./detalhe-lead-cliente";

interface DetalheLeadPageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalheLeadPage({ params }: DetalheLeadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, nome, telefone, instagram, especialidade, nicho, ponto_de_dor, mensagem_1, mensagem_2, mensagem_3, status, atribuido_a, valor_negociado"
    )
    .eq("id", id)
    .single();

  // RLS bloqueia o select se o funcionário não for o dono — chega como null/erro, nunca vaza dado de outro
  if (error || !lead) {
    notFound();
  }

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: atividades } = await supabase
    .from("lead_activities")
    .select("id, tipo, status_anterior, status_novo, nota_texto, criado_em, user_id, users:user_id(nome)")
    .eq("lead_id", id)
    .order("criado_em", { ascending: false });

  return (
    <DetalheLeadCliente
      lead={lead}
      usuarioAtualId={user.id}
      isAdmin={perfil?.role === "admin"}
      atividades={(atividades ?? []).map((a) => ({
        ...a,
        autor: Array.isArray(a.users)
          ? a.users[0]?.nome
          : (a.users as unknown as { nome: string } | null)?.nome,
      }))}
    />
  );
}
