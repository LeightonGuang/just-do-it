import { twMerge } from "tailwind-merge";

const projects = [
  { id: 1, name: "DV Dental" },
  { id: 2, name: "Saude Brasil" },
  { id: 3, name: "Gym" },
];

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

const ProjectSidebarItem = ({ project }: { project: { name: string } }) => {
  return <div className="text-xs">{project.name}</div>;
};
