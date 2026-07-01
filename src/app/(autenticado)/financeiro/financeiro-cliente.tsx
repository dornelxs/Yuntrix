"use client";

import { useRouter } from "next/navigation";

interface Financeiro {
  percentualComissao: number;
  valorTotalVendas: number;
  comissaoTotal: number;
  vendas: { nome: string; valor: number | null; data: string }[];
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinanceiroCliente({
  periodo,
  financeiro,
}: {
  periodo: "semanal" | "mensal";
  financeiro: Financeiro;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/financeiro?periodo=semanal")}
          className={
            periodo === "semanal"
              ? "px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold"
              : "px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-sm font-semibold"
          }
        >
          Semanal
        </button>
        <button
          onClick={() => router.push("/financeiro?periodo=mensal")}
          className={
            periodo === "mensal"
              ? "px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold"
              : "px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-sm font-semibold"
          }
        >
          Mensal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardMetrica
          titulo="Total vendido no período"
          valor={formatarMoeda(financeiro.valorTotalVendas)}
          cor="text-primary"
        />
        <CardMetrica
          titulo={`Comissão (${financeiro.percentualComissao}%)`}
          valor={formatarMoeda(financeiro.comissaoTotal)}
          cor="text-green-700"
        />
        <CardMetrica titulo="Vendas fechadas" valor={financeiro.vendas.length} />
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-3">
          Vendas fechadas no período
        </h3>
        <ul className="space-y-2">
          {financeiro.vendas.map((v, i) => (
            <li
              key={i}
              className="text-sm flex justify-between border-b border-surface-container-highest pb-2 last:border-0"
            >
              <span className="text-on-surface">{v.nome}</span>
              <span className="text-on-surface-variant">
                {v.valor != null ? formatarMoeda(v.valor) : "Valor não informado"} ·{" "}
                {new Date(v.data).toLocaleDateString("pt-BR")}
              </span>
            </li>
          ))}
          {financeiro.vendas.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Nenhuma venda fechada no período.
            </p>
          )}
        </ul>
      </div>
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
