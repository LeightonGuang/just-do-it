import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

import { type Project } from "../db/schema";

const ProjectsSidebar = ({ className }: { className?: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data: Project[] = await res.json();

    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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

      {projects.map((project, i) => (
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
