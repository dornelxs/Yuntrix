import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EquipeLista } from "./equipe-lista";

export default async function EquipePage() {
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

  const { data: usuarios } = await supabase
    .from("users")
    .select("id, nome, email, role, ativo, criado_em")
    .order("criado_em", { ascending: false });

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Equipe</h2>
          <p className="text-sm text-on-surface-variant">
            Gerencie os acessos dos funcionários
          </p>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full">
        <EquipeLista usuarios={usuarios ?? []} usuarioAtualId={user.id} />
      </div>
    </div>
  );
}
