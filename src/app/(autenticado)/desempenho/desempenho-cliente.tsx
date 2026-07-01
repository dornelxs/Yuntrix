"use client";

import { useRouter } from "next/navigation";
import { STATUS_LABEL, type StatusLead } from "@/lib/status-lead";

interface Metricas {
  leadsAtribuidos: number;
  contatados: number;
  interessados: number;
  fechados: number;
  leadsInativos: number;
  taxaConversao: number;
}

interface Atividade {
  tipo: string;
  statusNovo: string | null;
  criadoEm: string;
  nomeLead?: string;
}

export function DesempenhoCliente({
  periodo,
  metricas,
  atividadesRecentes,
}: {
  periodo: "semanal" | "mensal";
  metricas: Metricas;
  atividadesRecentes: Atividade[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/desempenho?periodo=semanal")}
          className={
            periodo === "semanal"
              ? "px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold"
              : "px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-sm font-semibold"
          }
        >
          Semanal
        </button>
        <button
          onClick={() => router.push("/desempenho?periodo=mensal")}
          className={
            periodo === "mensal"
              ? "px-4 py-1.5 bg-primary text-on-primary rounded-full text-sm font-semibold"
              : "px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-sm font-semibold"
          }
        >
          Mensal
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <CardMetrica titulo="Leads atribuídos" valor={metricas.leadsAtribuidos} cor="text-primary" />
        <CardMetrica titulo="Contatos realizados" valor={metricas.contatados} cor="text-primary" />
        <CardMetrica titulo="Interessados gerados" valor={metricas.interessados} cor="text-amber-600" />
        <CardMetrica titulo="Conversões (fechados)" valor={metricas.fechados} cor="text-green-700" />
        <CardMetrica
          titulo="Taxa de conversão"
          valor={`${metricas.taxaConversao.toFixed(1)}%`}
          cor={metricas.taxaConversao >= 10 ? "text-green-700" : "text-on-surface"}
        />
        <CardMetrica
          titulo="Leads inativos (+48h)"
          valor={metricas.leadsInativos}
          cor={metricas.leadsInativos > 0 ? "text-error" : "text-on-surface"}
        />
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-3">Meu funil simplificado</h3>
        <div className="space-y-2">
          <BarraFunil rotulo="Atribuídos" valor={metricas.leadsAtribuidos} total={metricas.leadsAtribuidos} />
          <BarraFunil rotulo="Contatados" valor={metricas.contatados} total={metricas.leadsAtribuidos} />
          <BarraFunil rotulo="Interessados" valor={metricas.interessados} total={metricas.leadsAtribuidos} />
          <BarraFunil rotulo="Fechados" valor={metricas.fechados} total={metricas.leadsAtribuidos} />
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-3">Histórico de atividade</h3>
        <ul className="space-y-2">
          {atividadesRecentes.map((a, i) => (
            <li key={i} className="text-sm text-on-surface-variant flex justify-between">
              <span>
                {a.tipo === "nota"
                  ? `Nota em ${a.nomeLead ?? "lead"}`
                  : `${a.nomeLead ?? "Lead"} → ${STATUS_LABEL[a.statusNovo as StatusLead] ?? a.statusNovo}`}
              </span>
              <span>{new Date(a.criadoEm).toLocaleString("pt-BR")}</span>
            </li>
          ))}
          {atividadesRecentes.length === 0 && (
            <p className="text-sm text-on-surface-variant">Nenhuma atividade no período.</p>
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

function BarraFunil({ rotulo, valor, total }: { rotulo: string; valor: number; total: number }) {
  const percentual = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-on-surface-variant mb-1">
        <span>{rotulo}</span>
        <span>{valor}</span>
      </div>
      <div className="w-full bg-surface-container-low rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
