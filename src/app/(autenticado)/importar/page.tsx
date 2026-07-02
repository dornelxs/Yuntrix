import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarFuncionarios, buscarNichosExistentes, listarLotes } from "./actions";
import { ImportarForm } from "./importar-form";
import { LotesLista } from "./lotes-lista";

interface ImportarPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function hojeLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function ImportarPage({ searchParams }: ImportarPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // "todos" mostra tudo; caso contrário filtra pelo dia (default: hoje).
  const filtroData =
    params.data === "todos"
      ? null
      : /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? "")
        ? (params.data as string)
        : hojeLocal();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    redirect("/dashboard");
  }

  const [funcionarios, nichos, lotes] = await Promise.all([
    buscarFuncionarios(),
    buscarNichosExistentes(),
    listarLotes(filtroData),
  ]);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div className="flex flex-col">
          <div className="flex items-center text-[10px] uppercase tracking-widest text-on-surface-variant gap-2">
            <span>Leads</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-bold">Importar</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Importar Planilha</h2>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full space-y-10">
        <ImportarForm funcionarios={funcionarios} nichos={nichos} />

        <section>
          <h2 className="text-lg font-bold text-on-surface mb-1">
            Planilhas importadas
          </h2>
          <p className="text-sm text-on-surface-variant mb-5">
            Separadas por data e nicho. Se um lote subiu com o nicho errado,
            use &quot;Alterar nicho&quot; para corrigir o lote e todos os seus leads de
            uma vez.
          </p>
          <LotesLista
            lotes={lotes}
            nichos={nichos}
            dataSelecionada={filtroData}
            hoje={hojeLocal()}
          />
        </section>
      </div>
    </div>
  );
}
