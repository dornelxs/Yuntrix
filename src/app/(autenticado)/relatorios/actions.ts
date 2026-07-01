"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ConfigState {
  erro?: string;
  sucesso?: boolean;
}

export async function atualizarPercentualComissao(
  _prevState: ConfigState,
  formData: FormData
): Promise<ConfigState> {
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

  if (perfil?.role !== "admin") {
    return { erro: "Apenas administradores podem alterar essa configuração." };
  }

  const percentual = parseFloat(formData.get("percentual") as string);
  if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
    return { erro: "Informe um percentual entre 0 e 100." };
  }

  const { error } = await supabase
    .from("configuracoes")
    .update({ valor: percentual.toString(), atualizado_em: new Date().toISOString() })
    .eq("chave", "percentual_comissao");

  if (error) return { erro: "Não foi possível salvar a configuração." };

  revalidatePath("/relatorios");
  revalidatePath("/minha-conta");
  return { sucesso: true };
}
