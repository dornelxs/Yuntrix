"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface NovoLeadState {
  erro?: string;
  sucesso?: boolean;
}

export async function criarLeadAvulso(
  _prevState: NovoLeadState,
  formData: FormData
): Promise<NovoLeadState> {
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

  const isAdmin = perfil?.role === "admin";

  const nome = (formData.get("nome") as string)?.trim();
  const nicho = (formData.get("nicho") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim() || null;
  const instagram = (formData.get("instagram") as string)?.trim() || null;
  const especialidade = (formData.get("especialidade") as string)?.trim() || null;
  const pontoDeDor = (formData.get("pontoDeDor") as string)?.trim() || null;
  const atribuidoAForm = formData.get("atribuidoA") as string;

  if (!nome || !nicho) {
    return { erro: "Preencha ao menos nome e nicho." };
  }
  if (!telefone && !instagram) {
    return { erro: "Informe telefone ou Instagram." };
  }

  const atribuidoA = isAdmin ? atribuidoAForm : user.id;
  if (!atribuidoA) {
    return { erro: "Selecione um funcionário responsável." };
  }

  await supabase.from("nichos").upsert({ nome: nicho }, { onConflict: "nome", ignoreDuplicates: true });

  const { error } = await supabase.from("leads").insert({
    nicho,
    nome,
    telefone,
    instagram,
    especialidade,
    ponto_de_dor: pontoDeDor,
    status: "sem_contato",
    atribuido_a: atribuidoA,
  });

  if (error) return { erro: "Não foi possível criar o lead." };

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { sucesso: true };
}
