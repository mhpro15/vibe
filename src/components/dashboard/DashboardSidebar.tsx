import Link from "next/link";
import { Users, FolderKanban, Layers } from "lucide-react";

interface Team {
  team: {
    id: string;
    name: string;
    _count: {
      members: number;
      projects: number;
    };
    projects: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface Project {
  id: string;
  name: string;
  team: {
    name: string;
  };
  _count: {
    issues: number;
  };
}

interface DashboardSidebarProps {
  teams: Team[];
  recentProjects: Project[];
}

function getProjectColor(name: string): string {
  const colors = [
    "from-violet-600 to-violet-800",
    "from-blue-600 to-blue-800",
    "from-emerald-600 to-emerald-800",
    "from-rose-600 to-rose-800",
    "from-amber-600 to-amber-800",
    "from-cyan-600 to-cyan-800",
    "from-pink-600 to-pink-800",
    "from-indigo-600 to-indigo-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getTeamColor(name: string): string {
  const colors = [
    "from-neutral-600 to-neutral-800",
    "from-slate-600 to-slate-800",
    "from-zinc-600 to-zinc-800",
    "from-stone-600 to-stone-800",
    "from-gray-600 to-gray-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function DashboardSidebar({
  teams,
  recentProjects,
}: DashboardSidebarProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* My Teams */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.2em]">
            My Teams
          </h2>
          <Link
            href="/teams"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {teams.map((membership) => (
            <div key={membership.team.id} className="space-y-1">
              <Link
                href={`/teams/${membership.team.id}`}
                className="flex items-center gap-3 md:gap-4 p-2.5 rounded-xl hover:bg-neutral-800/80 transition-all group border border-transparent hover:border-neutral-700/50"
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-linear-to-br ${getTeamColor(
                    membership.team.name
                  )} flex items-center justify-center text-white font-bold text-sm md:text-lg shrink-0 shadow-lg shadow-black/20`}
                >
                  {membership.team.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm md:text-base font-semibold text-neutral-200 group-hover:text-white transition-colors truncate block">
                    {membership.team.name}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Users className="w-3.5 h-3.5" />
                      {membership.team._count.members}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {membership.team._count.projects}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.2em]">
            Recent Projects
          </h2>
          <Link
            href="/projects"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-3 md:gap-4 p-2.5 rounded-xl hover:bg-neutral-800/80 transition-all group border border-transparent hover:border-neutral-700/50"
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-linear-to-br ${getProjectColor(
                  project.name
                )} flex items-center justify-center text-white font-bold text-sm md:text-lg shrink-0 shadow-lg shadow-black/20`}
              >
                {project.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm md:text-base font-semibold text-neutral-200 group-hover:text-white transition-colors truncate block">
                  {project.name}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-neutral-500 truncate font-medium">
                    {project.team.name}
                  </span>
                  <span className="text-neutral-700">•</span>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <Layers className="w-3.5 h-3.5" />
                    {project._count.issues}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
