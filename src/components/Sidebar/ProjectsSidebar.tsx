import { twMerge } from "tailwind-merge";
import { ArrowRight } from "lucide-react";

import { useSidebar } from "../contexts/SidebarContext";

import type { Project } from "../../db/schema";

const ProjectsSidebar = ({ className }: { className?: string }) => {
  const { sidebarProjects } = useSidebar();

  return (
    <div
      className={twMerge(
        "flex flex-col gap-1 border-t border-border p-4 md:p-2",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm">Projects</h2>
        <a
          href="/projects"
          className="flex items-center gap-1 text-[0.625rem] leading-0 text-text-muted hover:underline"
        >
          view all <ArrowRight className="size-2" />
        </a>
      </div>

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
      href={`/?project_id=${project.id}`}
      className="flex items-center gap-2 bg-card p-2 text-xs hover:bg-card-hover md:p-1"
    >
      <div
        style={{ backgroundColor: project.colour }}
        className="mt-0.5 size-2.5 shrink-0 rounded-xs border border-border"
      />
      <p>{project.name}</p>
    </a>
  );
};
