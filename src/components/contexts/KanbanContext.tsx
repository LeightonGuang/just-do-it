import { createContext } from "react";
import { useState, useEffect, useContext, useCallback } from "react";

import type { Column, Do, Project } from "../../db/schema";
import type { KanbanResponse } from "../../pages/api/projects/[projectId]";

type KanbanContextValue = {
  project: Project | null;
  columns: Column[];
  dos: Do[];

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
  const [error, setError] = useState<string>("");

  const fetchKanban = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);

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
  }, []);

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  return (
    <KanbanContext.Provider
      value={{
        project,
        columns,
        dos,
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
