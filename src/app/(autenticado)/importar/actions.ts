"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  parsearPlanilha,
  validarArquivo,
  chaveTelefone,
  chaveInstagram,
  type LeadImportado,
} from "@/lib/parser-planilha";
import { enviarNotificacaoNovoLote } from "@/lib/email";

export interface PreviewState {
  erro?: string;
  leads?: LeadImportado[];
  nomeArquivo?: string;
}

export async function gerarPreview(
  _prevState: PreviewState,
  formData: FormData
): Promise<PreviewState> {
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo || arquivo.size === 0) {
    return { erro: "Selecione um arquivo para importar." };
  }

  const erroValidacao = validarArquivo(arquivo.name, arquivo.size);
  if (erroValidacao) {
    return { erro: erroValidacao };
  }

  try {
    const buffer = await arquivo.arrayBuffer();
    const leads = parsearPlanilha(buffer);

    if (leads.length === 0) {
      return { erro: "Nenhuma linha foi encontrada na planilha." };
    }

    return { leads, nomeArquivo: arquivo.name };
  } catch {
    return {
      erro: "Não foi possível ler o arquivo. Confira se o formato é válido.",
    };
  }
}

export interface ConfirmarImportacaoState {
  erro?: string;
  sucesso?: boolean;
  totalImportado?: number;
  puladosPorDuplicata?: number;
  /** Nomes dos leads ignorados por já existirem (banco ou planilha). */
  nomesDuplicados?: string[];
}

export async function confirmarImportacao(
  _prevState: ConfirmarImportacaoState,
  formData: FormData
): Promise<ConfirmarImportacaoState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return { erro: "Apenas administradores podem importar planilhas." };
  }

  const nicho = formData.get("nicho") as string;
  const dataProspeccao = formData.get("dataProspeccao") as string;
  const atribuidoA = formData.get("atribuidoA") as string;
  const nomeArquivo = formData.get("nomeArquivo") as string;
  const leadsJson = formData.get("leads") as string;

  if (!nicho || !dataProspeccao || !atribuidoA || !leadsJson) {
    return { erro: "Preencha nicho, data de prospecção e funcionário responsável." };
  }

  await supabase.from("nichos").upsert({ nome: nicho }, { onConflict: "nome", ignoreDuplicates: true });

  const leads: LeadImportado[] = JSON.parse(leadsJson);
  const leadsValidos = leads.filter((l) => l.valido);

  if (leadsValidos.length === 0) {
    return { erro: "Nenhum lead selecionado para importação." };
  }

  // Carrega as chaves já existentes. A base é pequena (uma agência), então
  // buscar as duas colunas inteiras é mais simples e seguro do que montar um
  // filtro `.or()` com telefones que contêm vírgulas e parênteses.
  const { data: existentes, error: erroExistentes } = await supabase
    .from("leads")
    .select("telefone, instagram");

  if (erroExistentes) {
    return { erro: "Não foi possível verificar duplicados. Tente novamente." };
  }

  const telefonesExistentes = new Set(
    (existentes ?? []).map((e) => chaveTelefone(e.telefone)).filter(Boolean) as string[]
  );
  const instagramsExistentes = new Set(
    (existentes ?? []).map((e) => chaveInstagram(e.instagram)).filter(Boolean) as string[]
  );

  // Um lead é duplicado se casar por telefone OU por instagram. Campos vazios
  // nunca casam — só comparamos quando os dois lados têm valor.
  const leadsNovos: LeadImportado[] = [];
  const duplicados: string[] = [];
  // Também deduplica dentro da própria planilha (linhas repetidas no arquivo).
  const telefonesDaPlanilha = new Set<string>();
  const instagramsDaPlanilha = new Set<string>();

  for (const lead of leadsValidos) {
    const tel = chaveTelefone(lead.telefone);
    const insta = chaveInstagram(lead.instagram);

    const jaNoBanco =
      (tel !== null && telefonesExistentes.has(tel)) ||
      (insta !== null && instagramsExistentes.has(insta));
    const jaNaPlanilha =
      (tel !== null && telefonesDaPlanilha.has(tel)) ||
      (insta !== null && instagramsDaPlanilha.has(insta));

    if (jaNoBanco || jaNaPlanilha) {
      duplicados.push(lead.nome);
      continue;
    }

    if (tel) telefonesDaPlanilha.add(tel);
    if (insta) instagramsDaPlanilha.add(insta);
    leadsNovos.push(lead);
  }

  if (leadsNovos.length === 0) {
    return {
      erro: `Todos os ${leadsValidos.length} leads selecionados já existem no banco (duplicados por telefone/Instagram).`,
      nomesDuplicados: duplicados,
    };
  }

  const { data: batch, error: erroBatch } = await supabase
    .from("import_batches")
    .insert({
      nicho,
      data_prospeccao: dataProspeccao,
      atribuido_a: atribuidoA,
      total_leads: leadsNovos.length,
      arquivo_origem: nomeArquivo,
      importado_por: user.id,
    })
    .select("id")
    .single();

  if (erroBatch || !batch) {
    return { erro: "Não foi possível criar o lote de importação." };
  }

  const linhasParaInserir = leadsNovos.map((lead) => ({
    batch_id: batch.id,
    nicho,
    nome: lead.nome,
    telefone: lead.telefone,
    instagram: lead.instagram,
    possui_site: lead.possuiSite,
    especialidade: lead.especialidade,
    publico_atendido: lead.publicoAtendido,
    ponto_de_dor: lead.pontoDeDor,
    canal_recomendado: lead.canalRecomendado,
    score_oportunidade: lead.scoreOportunidade,
    prioridade: lead.prioridade,
    mensagem_1: lead.mensagem1,
    mensagem_2: lead.mensagem2,
    mensagem_3: lead.mensagem3,
    status: "sem_contato",
    atribuido_a: atribuidoA,
  }));

  const { error: erroLeads } = await supabase.from("leads").insert(linhasParaInserir);

  if (erroLeads) {
    return { erro: "Lote criado, mas houve erro ao gravar os leads. Contate o suporte." };
  }

  try {
    const [{ data: funcionario }, { data: admin }] = await Promise.all([
      supabase.from("users").select("nome, email").eq("id", atribuidoA).single(),
      supabase.from("users").select("nome").eq("id", user.id).single(),
    ]);

    if (funcionario) {
      await enviarNotificacaoNovoLote({
        funcionarioEmail: funcionario.email,
        funcionarioNome: funcionario.nome,
        nicho,
        totalLeads: linhasParaInserir.length,
        dataProspeccao,
        adminNome: admin?.nome ?? "O administrador",
      });
    }
  } catch (emailError) {
    console.error("Erro ao enviar e-mail de notificação:", emailError);
  }

  return {
    sucesso: true,
    totalImportado: linhasParaInserir.length,
    puladosPorDuplicata: duplicados.length,
    nomesDuplicados: duplicados,
  };
}

export async function buscarFuncionarios() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, nome")
    .eq("role", "funcionario")
    .eq("ativo", true)
    .order("nome");
  return data ?? [];
}

export async function buscarNichosExistentes() {
  const supabase = await createClient();
  const { data } = await supabase.from("nichos").select("nome").order("nome");
  return (data ?? []).map((n) => n.nome);
}

export interface LoteImportado {
  id: string;
  nicho: string;
  data_prospeccao: string;
  total_leads: number;
  arquivo_origem: string | null;
  criado_em: string;
  atribuidoA: string | null;
  responsavelNome: string | null;
}

// Passe uma data YYYY-MM-DD para trazer só os lotes daquele dia de prospecção.
// Sem argumento (ou null) traz todos.
export async function listarLotes(dia?: string | null): Promise<LoteImportado[]> {
  const supabase = await createClient();
  let query = supabase
    .from("import_batches")
    .select(
      "id, nicho, data_prospeccao, total_leads, arquivo_origem, criado_em, atribuido_a, users:atribuido_a(nome)"
    )
    .order("criado_em", { ascending: false });

  if (dia && /^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    query = query.eq("data_prospeccao", dia);
  }

  const { data } = await query;

  return (data ?? []).map((b) => ({
    id: b.id,
    nicho: b.nicho,
    data_prospeccao: b.data_prospeccao,
    total_leads: b.total_leads,
    arquivo_origem: b.arquivo_origem,
    criado_em: b.criado_em,
    atribuidoA: b.atribuido_a,
    responsavelNome: Array.isArray(b.users)
      ? b.users[0]?.nome ?? null
      : (b.users as unknown as { nome: string } | null)?.nome ?? null,
  }));
}

export interface AlterarNichoState {
  erro?: string;
  sucesso?: boolean;
}

export interface ReatribuirLoteState {
  erro?: string;
  sucesso?: boolean;
}

/**
 * Passa uma planilha inteira para outro funcionário: atualiza o lote E todos
 * os leads dele. Os dois precisam mudar juntos — a RLS filtra os leads por
 * `atribuido_a`, então sem propagar o novo responsável não veria nada.
 * O status e o histórico dos leads são preservados.
 */
export async function reatribuirLote(
  loteId: string,
  novoFuncionarioId: string
): Promise<ReatribuirLoteState> {
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
    return { erro: "Apenas administradores podem reatribuir planilhas." };
  }

  const { data: destino } = await supabase
    .from("users")
    .select("id, role, ativo")
    .eq("id", novoFuncionarioId)
    .single();

  if (!destino || destino.role !== "funcionario" || !destino.ativo) {
    return { erro: "Selecione um funcionário ativo." };
  }

  const { error: erroLote } = await supabase
    .from("import_batches")
    .update({ atribuido_a: novoFuncionarioId })
    .eq("id", loteId);
  if (erroLote) return { erro: "Não foi possível reatribuir a planilha." };

  const { error: erroLeads } = await supabase
    .from("leads")
    .update({ atribuido_a: novoFuncionarioId })
    .eq("batch_id", loteId);
  if (erroLeads) {
    return {
      erro: "Planilha reatribuída, mas houve erro ao mover os leads. Tente novamente.",
    };
  }

  revalidatePath("/importar");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/relatorios");
  return { sucesso: true };
}

// Troca o nicho de um lote inteiro numa única operação: atualiza o
// import_batches E propaga para todos os leads daquele lote (leads.nicho
// é uma cópia, precisa ficar em sincronia com o lote).
export async function alterarNichoLote(
  loteId: string,
  novoNicho: string
): Promise<AlterarNichoState> {
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
    return { erro: "Apenas administradores podem alterar o nicho." };
  }

  const nicho = novoNicho.trim();
  if (!nicho) return { erro: "Selecione um nicho válido." };

  // Garante que o nicho existe na tabela de nichos (idempotente).
  await supabase
    .from("nichos")
    .upsert({ nome: nicho }, { onConflict: "nome", ignoreDuplicates: true });

  const { error: erroLote } = await supabase
    .from("import_batches")
    .update({ nicho })
    .eq("id", loteId);
  if (erroLote) return { erro: "Não foi possível alterar o nicho do lote." };

  const { error: erroLeads } = await supabase
    .from("leads")
    .update({ nicho })
    .eq("batch_id", loteId);
  if (erroLeads) {
    return {
      erro: "Nicho do lote alterado, mas houve erro ao atualizar os leads. Tente novamente.",
    };
  }

  revalidatePath("/importar");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/nichos");
  return { sucesso: true };
}
