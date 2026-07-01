"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PerfilState {
  erro?: string;
  sucesso?: boolean;
}

export async function atualizarPerfil(
  _prevState: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { erro: "O nome não pode ficar vazio." };

  const { error } = await supabase.from("users").update({ nome }).eq("id", user.id);

  if (error) return { erro: "Não foi possível salvar as alterações." };

  revalidatePath("/minha-conta");
  return { sucesso: true };
}

export interface SenhaState {
  erro?: string;
  sucesso?: boolean;
}

export async function alterarSenha(
  _prevState: SenhaState,
  formData: FormData
): Promise<SenhaState> {
  const supabase = await createClient();

  const novaSenha = formData.get("novaSenha") as string;
  if (!novaSenha || novaSenha.length < 8) {
    return { erro: "A senha deve ter no mínimo 8 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { erro: "Não foi possível alterar a senha." };

  return { sucesso: true };
}
