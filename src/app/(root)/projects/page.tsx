import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getUserProjects, getFavoriteProjects } from "@/lib/actions/project";
import { ProjectsClient } from "./ProjectsClient";

export default async function ProjectsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const [projects, favorites] = await Promise.all([
    getUserProjects(),
    getFavoriteProjects(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">
          Projects
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          View and manage all your projects across teams
        </p>
      </div>

      <ProjectsClient projects={projects} favorites={favorites} />
    </div>
  );
}
