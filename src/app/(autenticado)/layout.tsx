import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";

export default async function AutenticadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("users")
    .select("nome, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="bg-background text-on-surface min-h-screen flex">
      <Sidebar
        nome={perfil?.nome ?? user.email ?? ""}
        role={perfil?.role ?? "funcionario"}
      />
      <main className="pt-14 lg:pt-0 lg:ml-[240px] flex-1 flex flex-col min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
}
