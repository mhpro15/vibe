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
    <div className="space-y-4 md:space-y-6">
      {/* My Teams */}
      <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-xs md:text-sm font-medium text-white uppercase tracking-wider">
            My Teams
          </h2>
          <Link
            href="/teams"
            className="text-[10px] md:text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="space-y-2">
          {teams.map((membership) => (
            <div key={membership.team.id} className="space-y-1">
              <Link
                href={`/teams/${membership.team.id}`}
                className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors group"
              >
                <div
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br ${getTeamColor(
                    membership.team.name
                  )} flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0 shadow-lg`}
                >
                  {membership.team.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs md:text-sm text-neutral-200 group-hover:text-white transition-colors truncate block">
                    {membership.team.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                      <Users className="w-2.5 h-2.5" />
                      {membership.team._count.members}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                      <FolderKanban className="w-2.5 h-2.5" />
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
      <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-xs md:text-sm font-medium text-white uppercase tracking-wider">
            Recent Projects
          </h2>
          <Link
            href="/projects"
            className="text-[10px] md:text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="space-y-2">
          {recentProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors group"
            >
              <div
                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br ${getProjectColor(
                  project.name
                )} flex items-center justify-center text-white font-bold text-xs md:text-sm shrink-0 shadow-lg`}
              >
                {project.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs md:text-sm text-neutral-200 group-hover:text-white transition-colors truncate block">
                  {project.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-neutral-500 truncate">
                    {project.team.name}
                  </span>
                  <span className="text-[10px] text-neutral-600">•</span>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                    <Layers className="w-2.5 h-2.5" />
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
