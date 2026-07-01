"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada.", supabase: null, user: null };

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return { erro: "Apenas administradores podem gerenciar a equipe.", supabase: null, user: null };
  }

  return { erro: null, supabase, user };
}

export interface CriarFuncionarioState {
  erro?: string;
  sucesso?: boolean;
}

export async function criarFuncionario(
  _prevState: CriarFuncionarioState,
  formData: FormData
): Promise<CriarFuncionarioState> {
  const { erro } = await exigirAdmin();
  if (erro) return { erro };

  const nome = (formData.get("nome") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const senha = formData.get("senha") as string;

  if (!nome || !email || !senha) {
    return { erro: "Preencha nome, e-mail e senha." };
  }
  if (senha.length < 8) {
    return { erro: "A senha deve ter no mínimo 8 caracteres." };
  }

  const admin = createAdminClient();

  const { data: novoUsuario, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (erroAuth || !novoUsuario.user) {
    return { erro: erroAuth?.message ?? "Não foi possível criar o usuário." };
  }

  const { error: erroInsert } = await admin.from("users").insert({
    id: novoUsuario.user.id,
    nome,
    email,
    role: "funcionario",
  });

  if (erroInsert) {
    await admin.auth.admin.deleteUser(novoUsuario.user.id);
    return { erro: "Não foi possível registrar o funcionário." };
  }

  revalidatePath("/equipe");
  return { sucesso: true };
}

export interface AcaoEquipeState {
  erro?: string;
  sucesso?: boolean;
}

export async function alternarAtivoFuncionario(
  funcionarioId: string,
  ativo: boolean
): Promise<AcaoEquipeState> {
  const { erro, user } = await exigirAdmin();
  if (erro) return { erro };

  if (funcionarioId === user!.id) {
    return { erro: "Você não pode desativar a própria conta." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("users").update({ ativo }).eq("id", funcionarioId);

  if (error) return { erro: "Não foi possível atualizar o funcionário." };

  revalidatePath("/equipe");
  return { sucesso: true };
}

export async function excluirFuncionario(funcionarioId: string): Promise<AcaoEquipeState> {
  const { erro, user } = await exigirAdmin();
  if (erro) return { erro };

  if (funcionarioId === user!.id) {
    return { erro: "Você não pode excluir a própria conta." };
  }

  const admin = createAdminClient();

  const [{ count: totalLeads }, { count: totalLotes }] = await Promise.all([
    admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("atribuido_a", funcionarioId),
    admin
      .from("import_batches")
      .select("id", { count: "exact", head: true })
      .eq("atribuido_a", funcionarioId),
  ]);

  if ((totalLeads ?? 0) > 0 || (totalLotes ?? 0) > 0) {
    return {
      erro: "Este funcionário já tem leads ou lotes atribuídos — desative o acesso em vez de excluir.",
    };
  }

  const { error: erroDelete } = await admin.from("users").delete().eq("id", funcionarioId);
  if (erroDelete) return { erro: "Não foi possível excluir o funcionário." };

  await admin.auth.admin.deleteUser(funcionarioId);

  revalidatePath("/equipe");
  return { sucesso: true };
}
