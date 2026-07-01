import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarFuncionarios, buscarNichosExistentes } from "./actions";
import { ImportarForm } from "./importar-form";

export default async function ImportarPage() {
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

  if (perfil?.role !== "admin") {
    redirect("/dashboard");
  }

  const [funcionarios, nichos] = await Promise.all([
    buscarFuncionarios(),
    buscarNichosExistentes(),
  ]);

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div className="flex flex-col">
          <div className="flex items-center text-[10px] uppercase tracking-widest text-on-surface-variant gap-2">
            <span>Leads</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-bold">Importar</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Importar Planilha</h2>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full">
        <ImportarForm funcionarios={funcionarios} nichos={nichos} />
      </div>
    </div>
  );
}
