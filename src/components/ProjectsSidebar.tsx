import { twMerge } from "tailwind-merge";

import { projects, type Project } from "../../public/data/projects";

const ProjectsSidebar = ({ className }: { className?: string }) => {
  return (
    <div
      className={twMerge(
        "flex flex-col gap-1 border-t border-border p-2",
        className,
      )}
    >
      <h2 className="text-sm">Projects</h2>

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
