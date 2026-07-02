import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadsFiltros } from "./leads-filtros";
import { NovoLeadBotao } from "./novo-lead-botao";
import { STATUS_LEAD, STATUS_LABEL, STATUS_BADGE_CLASS, PRIORIDADE_COR, PRIORIDADE_LABEL } from "@/lib/status-lead";

const POR_PAGINA = 20;

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function horasDesde(dataIso: string): number {
  return (Date.now() - new Date(dataIso).getTime()) / (1000 * 60 * 60);
}

function formatarTempoDecorrido(dataIso: string): string {
  const horas = horasDesde(dataIso);
  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${Math.floor(horas)}h`;
  return `Há ${Math.floor(horas / 24)}d`;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = perfil?.role === "admin";

  const [{ data: nichosRaw }, { data: funcionarios }] = await Promise.all([
    supabase.from("nichos").select("nome").order("nome"),
    isAdmin
      ? supabase.from("users").select("id, nome").eq("role", "funcionario").order("nome")
      : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ]);
  const nichos = (nichosRaw ?? []).map((n) => n.nome);

  const pagina = Math.max(1, parseInt(params.pagina ?? "1", 10) || 1);
  const inicio = (pagina - 1) * POR_PAGINA;
  const fim = inicio + POR_PAGINA - 1;

  let query = supabase
    .from("leads")
    .select(
      "id, nome, nicho, status, prioridade, telefone, instagram, atualizado_em, atribuido_a, users:atribuido_a(nome)",
      { count: "exact" }
    )
    .order("atualizado_em", { ascending: false })
    .range(inicio, fim);

  if (params.status) query = query.eq("status", params.status);
  if (params.nicho) query = query.eq("nicho", params.nicho);
  if (params.prioridade) query = query.eq("prioridade", params.prioridade);
  if (isAdmin && params.responsavel) query = query.eq("atribuido_a", params.responsavel);
  if (params.busca) {
    const termo = params.busca.trim();
    query = query.or(
      `nome.ilike.%${termo}%,telefone.ilike.%${termo}%,instagram.ilike.%${termo}%`
    );
  }

  const { data: leads, count } = await query;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Leads</h2>
        </div>
        <NovoLeadBotao nichos={nichos} funcionarios={funcionarios ?? []} isAdmin={isAdmin} />
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full">
        <LeadsFiltros
          nichos={nichos}
          funcionarios={funcionarios ?? []}
          isAdmin={isAdmin}
          totalEncontrado={count ?? 0}
        />

        {/* Cards mobile */}
        <div className="lg:hidden space-y-3 mt-6">
          {(leads ?? []).map((lead) => {
            const inativo = horasDesde(lead.atualizado_em) > 48;
            const responsavel = Array.isArray(lead.users)
              ? lead.users[0]
              : (lead.users as unknown as { nome: string } | null);
            return (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className={
                  inativo
                    ? "block bg-amber-50 border border-amber-300 rounded-xl p-4"
                    : "block bg-white border border-outline-variant rounded-xl p-4"
                }
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-xs shrink-0">
                    {lead.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface text-sm truncate">{lead.nome}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {lead.telefone ?? lead.instagram ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded uppercase">
                    {lead.nicho}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase ${STATUS_BADGE_CLASS[lead.status as keyof typeof STATUS_BADGE_CLASS]}`}
                  >
                    {STATUS_LABEL[lead.status as keyof typeof STATUS_LABEL] ?? lead.status}
                  </span>
                  {lead.prioridade && (
                    <span className="flex items-center gap-1 text-xs">
                      <span className={`w-2 h-2 rounded-full ${PRIORIDADE_COR[lead.prioridade]}`} />
                      {PRIORIDADE_LABEL[lead.prioridade]}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant mt-2">
                  {isAdmin && <span>{responsavel?.nome ?? "—"}</span>}
                  <span className={inativo ? "text-amber-700 font-semibold" : ""}>
                    {formatarTempoDecorrido(lead.atualizado_em)}
                  </span>
                </div>
              </Link>
            );
          })}
          {(leads ?? []).length === 0 && (
            <p className="text-center text-on-surface-variant text-sm py-12">
              Nenhum lead encontrado com os filtros atuais.
            </p>
          )}
        </div>

        {/* Tabela desktop */}
        <div className="hidden lg:block bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Nicho
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Prioridade
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Responsável
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Contato
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Última At.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {(leads ?? []).map((lead) => {
                  const inativo = horasDesde(lead.atualizado_em) > 48;
                  const responsavel = Array.isArray(lead.users)
                    ? lead.users[0]
                    : (lead.users as unknown as { nome: string } | null);
                  return (
                    <tr
                      key={lead.id}
                      className={
                        inativo
                          ? "border-l-4 border-l-amber-500 bg-amber-50 hover:bg-amber-100 transition-colors"
                          : "hover:bg-surface-container transition-colors"
                      }
                    >
                      <td className="p-0">
                        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 px-6 py-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-xs shrink-0">
                            {lead.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-on-surface text-sm">
                            {lead.nome}
                          </span>
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/leads/${lead.id}`} className="block px-6 py-3">
                          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded uppercase">
                            {lead.nicho}
                          </span>
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/leads/${lead.id}`} className="block px-6 py-3">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase ${STATUS_BADGE_CLASS[lead.status as keyof typeof STATUS_BADGE_CLASS]}`}
                          >
                            {STATUS_LABEL[lead.status as keyof typeof STATUS_LABEL] ?? lead.status}
                          </span>
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/leads/${lead.id}`} className="block px-6 py-3">
                          {lead.prioridade ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${PRIORIDADE_COR[lead.prioridade]}`}
                              />
                              <span className="text-sm">
                                {PRIORIDADE_LABEL[lead.prioridade]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-on-surface-variant">—</span>
                          )}
                        </Link>
                      </td>
                      {isAdmin && (
                        <td className="p-0">
                          <Link href={`/leads/${lead.id}`} className="block px-6 py-3 text-sm">
                            {responsavel?.nome ?? "—"}
                          </Link>
                        </td>
                      )}
                      <td className="p-0">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="block px-6 py-3 text-sm text-on-surface-variant"
                        >
                          {lead.telefone ?? lead.instagram ?? "—"}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link
                          href={`/leads/${lead.id}`}
                          className={`block px-6 py-3 text-sm font-semibold ${inativo ? "text-amber-700" : "text-on-surface-variant"}`}
                        >
                          {formatarTempoDecorrido(lead.atualizado_em)}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {(leads ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="px-6 py-12 text-center text-on-surface-variant text-sm"
                    >
                      Nenhum lead encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">
              Mostrando {(leads ?? []).length} de {count ?? 0} leads
            </span>
            <Paginacao pagina={pagina} total={count ?? 0} params={params} />
          </div>
        </div>

        <div className="lg:hidden flex justify-between items-center mt-4 px-1">
          <span className="text-sm text-on-surface-variant">
            {(leads ?? []).length} de {count ?? 0}
          </span>
          <Paginacao pagina={pagina} total={count ?? 0} params={params} />
        </div>
      </div>
    </div>
  );
}

function Paginacao({
  pagina,
  total,
  params,
}: {
  pagina: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  function hrefPagina(p: number) {
    const sp = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][]
    );
    sp.set("pagina", String(p));
    return `/leads?${sp.toString()}`;
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={pagina > 1 ? hrefPagina(pagina - 1) : undefined}
        aria-disabled={pagina <= 1}
        className="px-3 py-1.5 border border-outline-variant bg-white text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </a>
      <span className="text-sm text-on-surface-variant px-2">
        Página {pagina} de {totalPaginas}
      </span>
      <a
        href={pagina < totalPaginas ? hrefPagina(pagina + 1) : undefined}
        aria-disabled={pagina >= totalPaginas}
        className="px-3 py-1.5 border border-outline-variant bg-white text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors aria-disabled:opacity-50 aria-disabled:pointer-events-none"
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </a>
    </div>
  );
}
