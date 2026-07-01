"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StatusLead } from "@/lib/status-lead";

export interface AcaoLeadState {
  erro?: string;
  sucesso?: boolean;
}

export async function atualizarStatusLead(
  leadId: string,
  statusNovo: StatusLead
): Promise<AcaoLeadState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada." };

  const { data: leadAtual } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .single();

  if (!leadAtual) return { erro: "Lead não encontrado." };

  const { error: erroUpdate } = await supabase
    .from("leads")
    .update({ status: statusNovo, atualizado_em: new Date().toISOString() })
    .eq("id", leadId);

  if (erroUpdate) return { erro: "Não foi possível atualizar o status." };

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    user_id: user.id,
    tipo: "mudanca_status",
    status_anterior: leadAtual.status,
    status_novo: statusNovo,
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);

  return { sucesso: true };
}

export interface NotaState {
  erro?: string;
  sucesso?: boolean;
}

export async function adicionarNota(
  _prevState: NotaState,
  formData: FormData
): Promise<NotaState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada." };

  const leadId = formData.get("leadId") as string;
  const nota = (formData.get("nota") as string)?.trim();

  if (!nota) return { erro: "Escreva uma nota antes de salvar." };
  if (nota.length > 2000) return { erro: "Nota muito longa (máximo 2000 caracteres)." };

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    user_id: user.id,
    tipo: "nota",
    nota_texto: nota,
  });

  if (error) return { erro: "Não foi possível salvar a nota." };

  await supabase
    .from("leads")
    .update({ atualizado_em: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath(`/leads/${leadId}`);

  return { sucesso: true };
}

export async function excluirNota(notaId: string, leadId: string): Promise<AcaoLeadState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada." };

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: nota } = await supabase
    .from("lead_activities")
    .select("user_id, tipo")
    .eq("id", notaId)
    .single();

  if (!nota || nota.tipo !== "nota") {
    return { erro: "Nota não encontrada." };
  }

  if (nota.user_id !== user.id && perfil?.role !== "admin") {
    return { erro: "Você só pode excluir suas próprias notas." };
  }

  const { error } = await supabase
    .from("lead_activities")
    .delete()
    .eq("id", notaId)
    .eq("tipo", "nota");

  if (error) return { erro: "Não foi possível excluir a nota." };

  revalidatePath(`/leads/${leadId}`);

  return { sucesso: true };
}

export async function editarNota(
  notaId: string,
  leadId: string,
  novoTexto: string
): Promise<AcaoLeadState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada." };

  const texto = novoTexto.trim();
  if (!texto) return { erro: "A nota não pode ficar vazia." };
  if (texto.length > 2000) return { erro: "Nota muito longa (máximo 2000 caracteres)." };

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: nota } = await supabase
    .from("lead_activities")
    .select("user_id, tipo")
    .eq("id", notaId)
    .single();

  if (!nota || nota.tipo !== "nota") {
    return { erro: "Nota não encontrada." };
  }

  if (nota.user_id !== user.id && perfil?.role !== "admin") {
    return { erro: "Você só pode editar suas próprias notas." };
  }

  const { error } = await supabase
    .from("lead_activities")
    .update({ nota_texto: texto })
    .eq("id", notaId)
    .eq("tipo", "nota");

  if (error) return { erro: "Não foi possível editar a nota." };

  revalidatePath(`/leads/${leadId}`);

  return { sucesso: true };
}

export async function registrarValorNegociado(
  leadId: string,
  valor: number
): Promise<AcaoLeadState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada." };

  if (!Number.isFinite(valor) || valor < 0) {
    return { erro: "Informe um valor válido." };
  }

  const { error } = await supabase
    .from("leads")
    .update({ valor_negociado: valor })
    .eq("id", leadId);

  if (error) return { erro: "Não foi possível salvar o valor." };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/relatorios");
  revalidatePath("/minha-conta");

  return { sucesso: true };
}
