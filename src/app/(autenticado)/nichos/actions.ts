"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada.", supabase: null };

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return { erro: "Apenas administradores podem gerenciar nichos.", supabase: null };
  }

  return { erro: null, supabase };
}

export interface NichoState {
  erro?: string;
  sucesso?: boolean;
}

export async function criarNicho(
  _prevState: NichoState,
  formData: FormData
): Promise<NichoState> {
  const { erro, supabase } = await exigirAdmin();
  if (erro || !supabase) return { erro: erro! };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { erro: "Digite o nome do nicho." };

  const { error } = await supabase.from("nichos").insert({ nome });

  if (error) {
    if (error.code === "23505") return { erro: "Já existe um nicho com esse nome." };
    return { erro: "Não foi possível criar o nicho." };
  }

  revalidatePath("/nichos");
  return { sucesso: true };
}

export async function excluirNicho(nichoId: string): Promise<NichoState> {
  const { erro, supabase } = await exigirAdmin();
  if (erro || !supabase) return { erro: erro! };

  const { error } = await supabase.from("nichos").delete().eq("id", nichoId);
  if (error) return { erro: "Não foi possível excluir o nicho." };

  revalidatePath("/nichos");
  return { sucesso: true };
}
