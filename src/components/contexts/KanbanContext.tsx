import { useState } from "react";
import { createContext, useCallback, useContext, useEffect } from "react";

import type { Column, Do, Project } from "../../db/schema";
import type { KanbanResponse } from "../../pages/api/projects/[projectId]";

type KanbanContextValue = {
  projectId: string | null;

  project: Project | null;
  columns: Column[];
  dos: Do[];

  fetchKanban: () => Promise<void>;

  loading: boolean;
  error: string;
};

const KanbanContext = createContext<KanbanContextValue | undefined>(undefined);

export const KanbanProvider = ({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string | null;
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [dos, setDos] = useState<Do[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchKanban = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setColumns([]);
      setDos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/projects/${projectId}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch Kanban");

      const data: KanbanResponse = await response.json();

      setProject(data.project);
      setColumns(data.columns);
      setDos(data.dos);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  return (
    <KanbanContext.Provider
      value={{
        projectId,

        project,
        columns,
        dos,

        fetchKanban,

        loading,
        error,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
};

export const useKanban = () => {
  const context = useContext(KanbanContext);

  if (!context)
    throw new Error("useKanban must be used inside a KanbanProvider");

  return context;
};
