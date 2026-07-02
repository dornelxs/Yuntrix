"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Periodo } from "./data";
import { atualizarPercentualComissao, type ConfigState } from "./actions";

interface VisaoGeral {
  totalLeads: number;
  totalContatos: number;
  totalConversoes: number;
  taxaConversaoGeral: number;
  tempoMedioContatoHoras: number;
  nichosAtivos: number;
}

interface ConversaoNicho {
  nicho: string;
  total: number;
  contatados: number;
  fechados: number;
  taxaConversao: number;
}

interface PerformanceFuncionario {
  id: string;
  nome: string;
  leadsAtribuidos: number;
  leadsTrabalhados: number;
  leadsNaoTrabalhados: number;
  conversoes: number;
  taxaConversao: number;
  tempoMedioContatoHoras: number;
}

interface Lote {
  id: string;
  data: string;
  nicho: string;
  funcionario: string;
  totalImportado: number;
  contatados: number;
  fechados: number;
  taxa: number;
  status: string;
}

interface AtividadeDia {
  data: string;
  contatos: number;
  fechados: number;
}

interface Financeiro {
  percentualComissao: number;
  valorTotalVendas: number;
  comissaoTotal: number;
  porFuncionario: { id: string; nome: string; total: number; comissao: number }[];
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const configInicial: ConfigState = {};

function exportarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number)[][]) {
  const BOM = "﻿";
  const conteudo =
    BOM +
    [cabecalho, ...linhas].map((linha) => linha.map((v) => `"${v}"`).join(",")).join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function RelatoriosCliente({
  periodo,
  visaoGeral,
  conversaoPorNicho,
  performanceFuncionarios,
  lotes,
  atividadeDiaria,
  financeiro,
}: {
  periodo: Periodo;
  intervalo: { inicio: string; fim: string };
  visaoGeral: VisaoGeral;
  conversaoPorNicho: ConversaoNicho[];
  performanceFuncionarios: PerformanceFuncionario[];
  lotes: Lote[];
  atividadeDiaria: AtividadeDia[];
  financeiro: Financeiro;
}) {
  const router = useRouter();
  const [editandoPercentual, setEditandoPercentual] = useState(false);
  const [configState, configAction, configPending] = useActionState(
    atualizarPercentualComissao,
    configInicial
  );

  useEffect(() => {
    if (configState.sucesso) {
      setEditandoPercentual(false);
    }
  }, [configState.sucesso]);

  function mudarPeriodo(novoPeriodo: Periodo) {
    router.push(`/relatorios?periodo=${novoPeriodo}`);
  }

  function exportarNichos() {
    exportarCsv(
      `yuntrix_relatorio_nicho_${new Date().toISOString().slice(0, 10)}.csv`,
      ["Nicho", "Total leads", "Contatados", "Fechados", "Taxa de conversão (%)"],
      conversaoPorNicho.map((n) => [
        n.nicho,
        n.total,
        n.contatados,
        n.fechados,
        n.taxaConversao.toFixed(1),
      ])
    );
  }

  function exportarFuncionarios() {
    exportarCsv(
      `yuntrix_relatorio_funcionarios_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Funcionário",
        "Leads atribuídos",
        "Leads trabalhados",
        "Leads não trabalhados",
        "Conversões",
        "Taxa de conversão (%)",
      ],
      performanceFuncionarios.map((f) => [
        f.nome,
        f.leadsAtribuidos,
        f.leadsTrabalhados,
        f.leadsNaoTrabalhados,
        f.conversoes,
        f.taxaConversao.toFixed(1),
      ])
    );
  }

  function exportarLotes() {
    exportarCsv(
      `yuntrix_relatorio_lotes_${new Date().toISOString().slice(0, 10)}.csv`,
      ["Data", "Nicho", "Funcionário", "Total importado", "Contatados", "Fechados", "Taxa (%)", "Status"],
      lotes.map((l) => [
        new Date(l.data).toLocaleDateString("pt-BR"),
        l.nicho,
        l.funcionario,
        l.totalImportado,
        l.contatados,
        l.fechados,
        l.taxa.toFixed(1),
        l.status,
      ])
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-2">
        {(["semanal", "mensal"] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => mudarPeriodo(p)}
            className={
              periodo === p
                ? "px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold cursor-pointer transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
                : "px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-sm font-semibold cursor-pointer transition-all hover:bg-surface-container-high active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
            }
          >
            {p === "semanal" ? "Últimos 7 dias" : "Últimos 30 dias"}
          </button>
        ))}
      </div>

      <section>
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase mb-3">
          Visão geral da operação
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <CardMetrica titulo="Total de leads" valor={visaoGeral.totalLeads} />
          <CardMetrica titulo="Contatos realizados" valor={visaoGeral.totalContatos} />
          <CardMetrica titulo="Conversões" valor={visaoGeral.totalConversoes} cor="text-green-700" />
          <CardMetrica
            titulo="Taxa de conversão geral"
            valor={`${visaoGeral.taxaConversaoGeral.toFixed(1)}%`}
          />
          <CardMetrica
            titulo="Tempo médio até 1º contato"
            valor={`${visaoGeral.tempoMedioContatoHoras.toFixed(1)}h`}
          />
          <CardMetrica titulo="Nichos ativos" valor={visaoGeral.nichosAtivos} />
        </div>
      </section>

      <section className="bg-white border border-outline-variant rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">Conversão por nicho</h3>
            <p className="text-sm text-on-surface-variant">
              Distribuição de leads e taxa de fechamento por nicho
            </p>
          </div>
          <button
            onClick={exportarNichos}
            className="btn btn-secondary"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Nicho</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Total leads</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Contatados</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Fechados</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Taxa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {conversaoPorNicho.map((n) => (
                <tr key={n.nicho}>
                  <td className="py-3 text-sm font-semibold text-on-surface">{n.nicho}</td>
                  <td className="py-3 text-sm">{n.total}</td>
                  <td className="py-3 text-sm">{n.contatados}</td>
                  <td className="py-3 text-sm">{n.fechados}</td>
                  <td className="py-3 text-sm font-semibold">{n.taxaConversao.toFixed(1)}%</td>
                </tr>
              ))}
              {conversaoPorNicho.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-on-surface-variant">
                    Nenhum dado no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-on-surface">Performance por funcionário</h3>
          <button
            onClick={exportarFuncionarios}
            className="btn btn-secondary"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceFuncionarios.map((f) => (
            <div key={f.id} className="bg-white border border-outline-variant rounded-2xl p-5">
              <h4 className="font-semibold text-on-surface mb-3">{f.nome}</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] uppercase text-on-surface-variant">Atribuídos</p>
                  <p className="text-lg font-bold text-primary">{f.leadsAtribuidos}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface-variant">Conversão</p>
                  <p className="text-lg font-bold text-green-700">
                    {f.taxaConversao.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Trabalhados: {f.leadsTrabalhados} · Conversões: {f.conversoes}
              </p>
              <p
                className={`text-xs mt-1 ${f.leadsNaoTrabalhados > 0 ? "text-error font-semibold" : "text-on-surface-variant"}`}
              >
                Não trabalhados: {f.leadsNaoTrabalhados}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Tempo médio até contato: {f.tempoMedioContatoHoras.toFixed(1)}h
              </p>
            </div>
          ))}
          {performanceFuncionarios.length === 0 && (
            <p className="text-sm text-on-surface-variant col-span-full">
              Nenhum funcionário cadastrado.
            </p>
          )}
        </div>
      </section>

      <section className="bg-white border border-outline-variant rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-on-surface">Lotes de importação</h3>
          <button
            onClick={exportarLotes}
            className="btn btn-secondary"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Data</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Nicho</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Funcionário</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Total</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Contatados</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Fechados</th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {lotes.map((l) => (
                <tr key={l.id}>
                  <td className="py-3 text-sm">{new Date(l.data).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 text-sm font-semibold">{l.nicho}</td>
                  <td className="py-3 text-sm">{l.funcionario}</td>
                  <td className="py-3 text-sm">{l.totalImportado}</td>
                  <td className="py-3 text-sm">{l.contatados}</td>
                  <td className="py-3 text-sm">{l.fechados}</td>
                  <td className="py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        l.status === "concluido"
                          ? "bg-green-100 text-green-700"
                          : "bg-secondary-container text-on-secondary-container"
                      }`}
                    >
                      {l.status === "concluido" ? "Concluído" : "Em andamento"}
                    </span>
                  </td>
                </tr>
              ))}
              {lotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-on-surface-variant">
                    Nenhum lote no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-outline-variant rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-on-surface mb-4">Atividade por dia</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={atividadeDiaria}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e8fd" />
            <XAxis
              dataKey="data"
              tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              fontSize={12}
            />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => new Date(v as string).toLocaleDateString("pt-BR")}
            />
            <Legend />
            <Line type="monotone" dataKey="contatos" name="Contatos" stroke="#004ac6" strokeWidth={2} />
            <Line type="monotone" dataKey="fechados" name="Conversões" stroke="#15803d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="bg-white border border-outline-variant rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">Financeiro</h3>
            <p className="text-sm text-on-surface-variant">
              Valores negociados e comissões da equipe no período
            </p>
          </div>
          <button
            onClick={() => setEditandoPercentual((v) => !v)}
            className="btn btn-secondary"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Configurar comissão
          </button>
        </div>

        {editandoPercentual && (
          <form
            action={configAction}
            className="flex items-end gap-3 mb-6 bg-surface-container-low rounded-lg p-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase text-on-surface-variant">
                Percentual de comissão (%)
              </label>
              <input
                name="percentual"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={financeiro.percentualComissao}
                className="input w-32"
              />
            </div>
            <button
              type="submit"
              disabled={configPending}
              className="btn btn-primary"
            >
              {configPending ? "Salvando..." : "Salvar"}
            </button>
            {configState.erro && <p className="text-sm text-error">{configState.erro}</p>}
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <CardMetrica titulo="Total vendido" valor={formatarMoeda(financeiro.valorTotalVendas)} />
          <CardMetrica
            titulo={`Comissão total (${financeiro.percentualComissao}%)`}
            valor={formatarMoeda(financeiro.comissaoTotal)}
            cor="text-green-700"
          />
          <CardMetrica
            titulo="Funcionários com vendas"
            valor={financeiro.porFuncionario.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[400px]">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                  Funcionário
                </th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                  Total vendido
                </th>
                <th className="py-2 text-xs font-semibold uppercase text-on-surface-variant">
                  Comissão
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {financeiro.porFuncionario.map((f) => (
                <tr key={f.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 text-sm font-semibold text-primary">
                    <Link href={`/relatorios/funcionario/${f.id}`} className="hover:underline">
                      {f.nome}
                    </Link>
                  </td>
                  <td className="py-3 text-sm">{formatarMoeda(f.total)}</td>
                  <td className="py-3 text-sm text-green-700 font-semibold">
                    {formatarMoeda(f.comissao)}
                  </td>
                </tr>
              ))}
              {financeiro.porFuncionario.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-on-surface-variant">
                    Nenhuma venda com valor registrado no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CardMetrica({
  titulo,
  valor,
  cor = "text-on-surface",
}: {
  titulo: string;
  valor: number | string;
  cor?: string;
}) {
  return (
    <div className="bg-white border border-outline-variant rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase text-on-surface-variant mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
    </div>
  );
}
