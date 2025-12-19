import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getUserProjects } from "@/lib/actions/project/queries";
import { getUserTeams } from "@/lib/actions/team/queries";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const [projects, teams] = await Promise.all([
    getUserProjects(),
    getUserTeams(),
  ]);

  return (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar
        user={session.user}
        projects={projects.slice(0, 5)}
        teams={teams.slice(0, 5)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-neutral-950">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
