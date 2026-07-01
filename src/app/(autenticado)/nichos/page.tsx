import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NichosLista } from "./nichos-lista";

export default async function NichosPage() {
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

  if (perfil?.role !== "admin") redirect("/dashboard");

  const [{ data: nichos }, { data: leads }, { data: lotes }] = await Promise.all([
    supabase.from("nichos").select("id, nome, criado_em").order("nome"),
    supabase.from("leads").select("nicho"),
    supabase.from("import_batches").select("nicho"),
  ]);

  const contagemLeads = new Map<string, number>();
  (leads ?? []).forEach((l) => {
    contagemLeads.set(l.nicho, (contagemLeads.get(l.nicho) ?? 0) + 1);
  });

  const contagemLotes = new Map<string, number>();
  (lotes ?? []).forEach((l) => {
    contagemLotes.set(l.nicho, (contagemLotes.get(l.nicho) ?? 0) + 1);
  });

  const nichosComContagem = (nichos ?? []).map((n) => ({
    ...n,
    totalLeads: contagemLeads.get(n.nome) ?? 0,
    totalLotes: contagemLotes.get(n.nome) ?? 0,
  }));

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Nichos</h2>
          <p className="text-sm text-on-surface-variant">
            Gerencie as categorias de leads usadas na importação
          </p>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full">
        <NichosLista nichos={nichosComContagem} />
      </div>
    </div>
  );
}
