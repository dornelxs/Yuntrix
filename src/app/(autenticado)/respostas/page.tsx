import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type StatusLead } from "@/lib/status-lead";
import { RespostasLista } from "./respostas-lista";

export interface Resposta {
  id: string;
  titulo: string;
  conteudo: string;
  status_relacionado: StatusLead | null;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  autorNome: string | null;
}

export default async function RespostasPage() {
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

  const isAdmin = perfil?.role === "admin";

  const { data: raw } = await supabase
    .from("respostas_prontas")
    .select(
      "id, titulo, conteudo, status_relacionado, criado_por, criado_em, atualizado_em, users:criado_por(nome)"
    )
    .order("atualizado_em", { ascending: false });

  const respostas: Resposta[] = (raw ?? []).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    conteudo: r.conteudo,
    status_relacionado: r.status_relacionado,
    criado_por: r.criado_por,
    criado_em: r.criado_em,
    atualizado_em: r.atualizado_em,
    autorNome: Array.isArray(r.users)
      ? r.users[0]?.nome ?? null
      : (r.users as unknown as { nome: string } | null)?.nome ?? null,
  }));

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Respostas Prontas</h2>
          <p className="text-sm text-on-surface-variant">
            Biblioteca de textos para situações que se repetem no atendimento
          </p>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full">
        <RespostasLista
          respostas={respostas}
          usuarioId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
