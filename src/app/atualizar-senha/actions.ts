"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AtualizarSenhaState {
  erro?: string;
}

export async function atualizarSenha(
  _prevState: AtualizarSenhaState,
  formData: FormData
): Promise<AtualizarSenhaState> {
  const novaSenha = formData.get("novaSenha") as string;

  if (!novaSenha || novaSenha.length < 8) {
    return { erro: "A senha deve ter no mínimo 8 caracteres." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    return { erro: "Não foi possível atualizar a senha. Solicite um novo link." };
  }

  redirect("/dashboard");
}
