import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MinhaContaCliente } from "./minha-conta-cliente";

export default async function MinhaContaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("users")
    .select("nome, email, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <header className="min-h-14 lg:h-16 py-2 lg:py-0 px-4 lg:px-8 flex items-center justify-between sticky top-14 lg:top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Minha conta</h2>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <MinhaContaCliente
          perfil={{ nome: perfil?.nome ?? "", email: perfil?.email ?? "", role: perfil?.role ?? "" }}
        />
      </div>
    </div>
  );
}
