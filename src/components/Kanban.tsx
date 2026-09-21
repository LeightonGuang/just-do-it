import { useEffect, useState } from "react";

import type { Column, Do, Project } from "../db/schema";
import type { ProjectResponse } from "../pages/api/projects/[projectId]";

const Kanban = ({
  projectId,
  todoId,
}: {
  projectId: string;
  todoId: string | null;
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [dos, setDos] = useState<Do[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }

        const data: ProjectResponse = await response.json();

        setProject(data.project);
        setColumns(data.columns);
        setDos(data.dos);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <section className="size-full min-h-screen border border-border p-8">
        <p className="text-text-muted">Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="size-full min-h-screen border border-border p-8">
        <p className="text-red-500">{error}</p>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="size-full min-h-screen border border-border p-8">
        <p className="text-text-muted">Project not found.</p>
      </section>
    );
  }

  return (
    <section className="size-full min-h-screen border border-border p-8">
      <h1 className="mb-8 leading-4 font-medium text-text">{project.name}</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {columns.map((column) => {
          const columnDos = dos.filter(
            (doItem) => doItem.column_id === column.id,
          );

          return (
            <article
              key={column.id}
              className="border border-border bg-card p-2"
            >
              <h2 className="leading-8 font-semibold text-text">
                {column.name}
              </h2>

              <div className="mt-4 flex flex-col gap-2">
                {columnDos.map((doItem) => (
                  <div
                    key={doItem.id}
                    className="border border-border bg-do p-3 transition-colors hover:bg-do-hover"
                  >
                    <p className="font-medium text-text">{doItem.title}</p>

                    {doItem.description && (
                      <p className="mt-1 text-sm text-text-muted">
                        {doItem.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Kanban;
