"use server";

import { createClient } from "@/lib/supabase/server";
import {
  parsearPlanilha,
  validarArquivo,
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

  const telefones = leadsValidos.map((l) => l.telefone).filter(Boolean) as string[];
  const instagrams = leadsValidos.map((l) => l.instagram).filter(Boolean) as string[];

  const { data: existentes } = await supabase
    .from("leads")
    .select("telefone, instagram")
    .or(
      [
        telefones.length ? `telefone.in.(${telefones.map((t) => `"${t}"`).join(",")})` : null,
        instagrams.length ? `instagram.in.(${instagrams.map((i) => `"${i}"`).join(",")})` : null,
      ]
        .filter(Boolean)
        .join(",")
    );

  const telefonesExistentes = new Set((existentes ?? []).map((e) => e.telefone).filter(Boolean));
  const instagramsExistentes = new Set((existentes ?? []).map((e) => e.instagram).filter(Boolean));

  const leadsNovos = leadsValidos.filter(
    (l) =>
      !(l.telefone && telefonesExistentes.has(l.telefone)) &&
      !(l.instagram && instagramsExistentes.has(l.instagram))
  );

  if (leadsNovos.length === 0) {
    return { erro: "Todos os leads selecionados já existem no banco (duplicados por telefone/instagram)." };
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
    puladosPorDuplicata: leadsValidos.length - leadsNovos.length,
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
