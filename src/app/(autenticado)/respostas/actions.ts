"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LEAD, type StatusLead } from "@/lib/status-lead";

export interface RespostaState {
  erro?: string;
  sucesso?: boolean;
}

async function sessao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada.", supabase: null, user: null, isAdmin: false };

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    erro: null,
    supabase,
    user,
    isAdmin: perfil?.role === "admin",
  };
}

function statusValido(valor: string | null): StatusLead | null {
  if (!valor) return null;
  return (STATUS_LEAD as readonly string[]).includes(valor)
    ? (valor as StatusLead)
    : null;
}

export async function criarResposta(
  _prevState: RespostaState,
  formData: FormData
): Promise<RespostaState> {
  const { erro, supabase, user } = await sessao();
  if (erro || !supabase || !user) return { erro: erro ?? "Sessão expirada." };

  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string)?.trim();
  const statusRelacionado = statusValido(
    (formData.get("statusRelacionado") as string)?.trim() || null
  );

  if (!titulo) return { erro: "Descreva a situação (título)." };
  if (!conteudo) return { erro: "Escreva o texto da resposta." };

  const { error } = await supabase.from("respostas_prontas").insert({
    titulo,
    conteudo,
    status_relacionado: statusRelacionado,
    criado_por: user.id,
  });

  if (error) return { erro: "Não foi possível salvar a resposta." };

  revalidatePath("/respostas");
  return { sucesso: true };
}

export async function editarResposta(
  _prevState: RespostaState,
  formData: FormData
): Promise<RespostaState> {
  const { erro, supabase, user, isAdmin } = await sessao();
  if (erro || !supabase || !user) return { erro: erro ?? "Sessão expirada." };

  const id = (formData.get("id") as string)?.trim();
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string)?.trim();
  const statusRelacionado = statusValido(
    (formData.get("statusRelacionado") as string)?.trim() || null
  );

  if (!id) return { erro: "Resposta inválida." };
  if (!titulo) return { erro: "Descreva a situação (título)." };
  if (!conteudo) return { erro: "Escreva o texto da resposta." };

  // Confere a posse antes de atualizar (a RLS também protege, mas isto
  // dá uma mensagem de erro clara em vez de um update silencioso de 0 linhas).
  const { data: existente } = await supabase
    .from("respostas_prontas")
    .select("criado_por")
    .eq("id", id)
    .single();

  if (!existente) return { erro: "Resposta não encontrada." };
  if (existente.criado_por !== user.id && !isAdmin) {
    return { erro: "Você só pode editar as suas próprias respostas." };
  }

  const { error } = await supabase
    .from("respostas_prontas")
    .update({
      titulo,
      conteudo,
      status_relacionado: statusRelacionado,
    })
    .eq("id", id);

  if (error) return { erro: "Não foi possível salvar as alterações." };

  revalidatePath("/respostas");
  return { sucesso: true };
}

export async function excluirResposta(id: string): Promise<RespostaState> {
  const { erro, supabase, user, isAdmin } = await sessao();
  if (erro || !supabase || !user) return { erro: erro ?? "Sessão expirada." };

  const { data: existente } = await supabase
    .from("respostas_prontas")
    .select("criado_por")
    .eq("id", id)
    .single();

  if (!existente) return { erro: "Resposta não encontrada." };
  if (existente.criado_por !== user.id && !isAdmin) {
    return { erro: "Você só pode excluir as suas próprias respostas." };
  }

  const { error } = await supabase.from("respostas_prontas").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir a resposta." };

  revalidatePath("/respostas");
  return { sucesso: true };
}
