import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calcularFunil } from "@/lib/metricas";

export type Periodo = "semanal" | "mensal" | "personalizado";

export function calcularIntervalo(
  periodo: Periodo,
  inicioCustom?: string,
  fimCustom?: string
): { inicio: string; fim: string } {
  const fim = new Date();
  if (periodo === "personalizado" && inicioCustom && fimCustom) {
    return { inicio: inicioCustom, fim: fimCustom };
  }
  const inicio = new Date();
  if (periodo === "semanal") {
    inicio.setDate(inicio.getDate() - 7);
  } else {
    inicio.setDate(inicio.getDate() - 30);
  }
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

export async function buscarVisaoGeral(inicio: string, fim: string) {
  const supabase = await createClient();

  // Coorte: os leads importados no período. O funil sai do status ATUAL
  // deles (ver lib/metricas.ts), não de eventos — assim um lead marcado
  // como fechado por engano e depois revertido não conta como conversão.
  const [{ data: leadsPeriodo }, { data: atividades }] = await Promise.all([
    supabase
      .from("leads")
      .select("status, nicho")
      .gte("criado_em", inicio)
      .lte("criado_em", fim),
    // Só para o tempo médio até o 1º contato, que depende do histórico.
    supabase
      .from("lead_activities")
      .select("status_novo, criado_em, lead_id, leads:lead_id(criado_em)")
      .eq("tipo", "mudanca_status")
      .eq("status_novo", "contatado")
      .gte("criado_em", inicio)
      .lte("criado_em", fim),
  ]);

  const funil = calcularFunil(leadsPeriodo ?? []);
  const nichosAtivos = new Set((leadsPeriodo ?? []).map((l) => l.nicho)).size;

  const temposContato = (atividades ?? [])
    .map((a) => {
      const lead = Array.isArray(a.leads) ? a.leads[0] : (a.leads as unknown as { criado_em: string } | null);
      if (!lead) return null;
      return (new Date(a.criado_em).getTime() - new Date(lead.criado_em).getTime()) / (1000 * 60 * 60);
    })
    .filter((h): h is number => h !== null);

  const tempoMedioContato =
    temposContato.length > 0
      ? temposContato.reduce((a, b) => a + b, 0) / temposContato.length
      : 0;

  return {
    totalLeads: funil.total,
    totalContatos: funil.contatados,
    totalConversoes: funil.fechados,
    taxaConversaoGeral: funil.taxaConversao,
    tempoMedioContatoHoras: tempoMedioContato,
    nichosAtivos,
  };
}

export async function buscarConversaoPorNicho(inicio: string, fim: string) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("nicho, status")
    .gte("criado_em", inicio)
    .lte("criado_em", fim);

  // Agrupa os leads do período por nicho e aplica a mesma regra de funil.
  const porNicho = new Map<string, { status: string | null }[]>();
  (leads ?? []).forEach((l) => {
    const lista = porNicho.get(l.nicho) ?? [];
    lista.push({ status: l.status });
    porNicho.set(l.nicho, lista);
  });

  return Array.from(porNicho.entries())
    .map(([nicho, leadsDoNicho]) => {
      const funil = calcularFunil(leadsDoNicho);
      return {
        nicho,
        total: funil.total,
        contatados: funil.contatados,
        fechados: funil.fechados,
        taxaConversao: funil.taxaConversao,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function buscarPerformancePorFuncionario(inicio: string, fim: string) {
  const supabase = await createClient();

  const { data: funcionarios } = await supabase
    .from("users")
    .select("id, nome")
    .eq("role", "funcionario")
    .order("nome");

  const resultados = await Promise.all(
    (funcionarios ?? []).map(async (f) => {
      // Coorte do funcionário: leads atribuídos a ele que entraram no período.
      // O funil vem do status ATUAL desses leads, não de eventos.
      const [{ data: leadsDoFuncionario }, { data: atividades }] = await Promise.all([
        supabase
          .from("leads")
          .select("status")
          .eq("atribuido_a", f.id)
          .gte("criado_em", inicio)
          .lte("criado_em", fim),
        supabase
          .from("lead_activities")
          .select("status_novo, criado_em, lead_id, leads:lead_id(criado_em)")
          .eq("user_id", f.id)
          .eq("tipo", "mudanca_status")
          .gte("criado_em", inicio)
          .lte("criado_em", fim),
      ]);

      const funil = calcularFunil(leadsDoFuncionario ?? []);
      const atribuidos = funil.total;
      const conversoes = funil.fechados;
      const naoTrabalhados = funil.semContato;
      // Esforço: quantos leads distintos ele mexeu no período (baseado em
      // atividade mesmo — é o que mede trabalho, não resultado).
      const leadsTrabalhados = new Set((atividades ?? []).map((a) => a.lead_id)).size;

      const temposContato = (atividades ?? [])
        .filter((a) => a.status_novo === "contatado")
        .map((a) => {
          const lead = Array.isArray(a.leads) ? a.leads[0] : (a.leads as unknown as { criado_em: string } | null);
          if (!lead) return null;
          return (new Date(a.criado_em).getTime() - new Date(lead.criado_em).getTime()) / (1000 * 60 * 60);
        })
        .filter((h): h is number => h !== null);

      const tempoMedioContato =
        temposContato.length > 0
          ? temposContato.reduce((a, b) => a + b, 0) / temposContato.length
          : 0;

      return {
        id: f.id,
        nome: f.nome,
        leadsAtribuidos: atribuidos,
        leadsTrabalhados,
        leadsNaoTrabalhados: naoTrabalhados,
        conversoes,
        taxaConversao: funil.taxaConversao,
        tempoMedioContatoHoras: tempoMedioContato,
      };
    })
  );

  return resultados;
}

export async function buscarLotesImportacao(inicio: string, fim: string) {
  const supabase = await createClient();

  const { data: lotes } = await supabase
    .from("import_batches")
    .select("id, nicho, data_prospeccao, total_leads, status, atribuido_a, users:atribuido_a(nome)")
    .gte("criado_em", inicio)
    .lte("criado_em", fim)
    .order("data_prospeccao", { ascending: false });

  const resultados = await Promise.all(
    (lotes ?? []).map(async (lote) => {
      const { data: leadsDoLote } = await supabase
        .from("leads")
        .select("status")
        .eq("batch_id", lote.id);

      const contatados = (leadsDoLote ?? []).filter((l) => l.status !== "sem_contato").length;
      const fechados = (leadsDoLote ?? []).filter((l) => l.status === "fechado").length;
      const responsavel = Array.isArray(lote.users)
        ? lote.users[0]
        : (lote.users as unknown as { nome: string } | null);

      return {
        id: lote.id,
        data: lote.data_prospeccao,
        nicho: lote.nicho,
        funcionario: responsavel?.nome ?? "—",
        totalImportado: lote.total_leads,
        contatados,
        fechados,
        taxa: lote.total_leads ? (fechados / lote.total_leads) * 100 : 0,
        status: lote.status,
      };
    })
  );

  return resultados;
}

export async function buscarAtividadeDiaria(inicio: string, fim: string) {
  const supabase = await createClient();

  const { data: atividades } = await supabase
    .from("lead_activities")
    .select("tipo, status_novo, criado_em")
    .eq("tipo", "mudanca_status")
    .gte("criado_em", inicio)
    .lte("criado_em", fim);

  const dias: { data: string; contatos: number; fechados: number }[] = [];
  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);

  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    const chave = d.toISOString().slice(0, 10);
    const doDia = (atividades ?? []).filter((a) => a.criado_em.slice(0, 10) === chave);
    dias.push({
      data: chave,
      contatos: doDia.filter((a) => a.status_novo === "contatado").length,
      fechados: doDia.filter((a) => a.status_novo === "fechado").length,
    });
  }

  return dias;
}

export async function buscarVisaoFinanceira(inicio: string, fim: string) {
  const supabase = await createClient();

  const [{ data: leadsFechados }, { data: configComissao }] = await Promise.all([
    supabase
      .from("leads")
      .select("valor_negociado, atribuido_a, users:atribuido_a(nome)")
      .eq("status", "fechado")
      .gte("atualizado_em", inicio)
      .lte("atualizado_em", fim),
    supabase.from("configuracoes").select("valor").eq("chave", "percentual_comissao").single(),
  ]);

  const percentualComissao = parseFloat(configComissao?.valor ?? "0");
  const valorTotalVendas = (leadsFechados ?? []).reduce(
    (soma, l) => soma + (l.valor_negociado ?? 0),
    0
  );
  const comissaoTotal = valorTotalVendas * (percentualComissao / 100);

  const porFuncionario = new Map<string, { id: string; nome: string; total: number }>();
  (leadsFechados ?? []).forEach((l) => {
    if (!l.atribuido_a) return;
    const responsavel = Array.isArray(l.users) ? l.users[0] : (l.users as unknown as { nome: string } | null);
    const atual = porFuncionario.get(l.atribuido_a) ?? {
      id: l.atribuido_a,
      nome: responsavel?.nome ?? "—",
      total: 0,
    };
    atual.total += l.valor_negociado ?? 0;
    porFuncionario.set(l.atribuido_a, atual);
  });

  return {
    percentualComissao,
    valorTotalVendas,
    comissaoTotal,
    porFuncionario: Array.from(porFuncionario.values()).map((f) => ({
      ...f,
      comissao: f.total * (percentualComissao / 100),
    })),
  };
}

export async function buscarVendasFuncionario(funcionarioId: string, inicio: string, fim: string) {
  const supabase = await createClient();

  const [{ data: funcionario }, { data: leadsFechados }, { data: configComissao }] =
    await Promise.all([
      supabase.from("users").select("nome, email").eq("id", funcionarioId).single(),
      supabase
        .from("leads")
        .select("id, nome, nicho, valor_negociado, atualizado_em")
        .eq("atribuido_a", funcionarioId)
        .eq("status", "fechado")
        .gte("atualizado_em", inicio)
        .lte("atualizado_em", fim)
        .order("atualizado_em", { ascending: false }),
      supabase.from("configuracoes").select("valor").eq("chave", "percentual_comissao").single(),
    ]);

  const percentualComissao = parseFloat(configComissao?.valor ?? "0");
  const valorTotalVendas = (leadsFechados ?? []).reduce(
    (soma, l) => soma + (l.valor_negociado ?? 0),
    0
  );

  return {
    funcionario: { nome: funcionario?.nome ?? "—", email: funcionario?.email ?? "" },
    percentualComissao,
    valorTotalVendas,
    comissaoTotal: valorTotalVendas * (percentualComissao / 100),
    vendas: (leadsFechados ?? []).map((l) => ({
      id: l.id,
      nome: l.nome,
      nicho: l.nicho,
      valor: l.valor_negociado,
      data: l.atualizado_em,
    })),
  };
}
