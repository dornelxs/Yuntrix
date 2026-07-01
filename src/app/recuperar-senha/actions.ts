"use server";

import { createClient } from "@/lib/supabase/server";

export interface RecuperarSenhaState {
  erro?: string;
  sucesso?: boolean;
}

export async function solicitarRecuperacao(
  _prevState: RecuperarSenhaState,
  formData: FormData
): Promise<RecuperarSenhaState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { erro: "Informe seu e-mail." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atualizar-senha`,
  });

  if (error) {
    return { erro: "Não foi possível enviar o e-mail de recuperação." };
  }

  return { sucesso: true };
}
