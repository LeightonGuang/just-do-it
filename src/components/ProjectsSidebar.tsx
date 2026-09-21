import { twMerge } from "tailwind-merge";

import { type Project } from "../db/schema";
import { useSidebar } from "./contexts/SidebarContext";

const ProjectsSidebar = ({ className }: { className?: string }) => {
  const { sidebarProjects } = useSidebar();

  return (
    <div
      className={twMerge(
        "flex flex-col gap-1 border-t border-border p-2",
        className,
      )}
    >
      <h2 className="text-sm">
        <a className="hover:underline" href="/projects">
          Projects
        </a>
      </h2>

      {sidebarProjects.map((project) => (
        <ProjectSidebarItem
          project={project}
          key={`${project.name}-${project.id}`}
        />
      ))}
    </div>
  );
};

export default ProjectsSidebar;

const ProjectSidebarItem = ({ project }: { project: Project }) => {
  return (
    <a
      style={{ color: project.colour }}
      href={`/?project_id=${project.id}`}
      className="bg-card p-1 text-xs hover:bg-card-hover"
    >
      {project.name}
    </a>
  );
};
