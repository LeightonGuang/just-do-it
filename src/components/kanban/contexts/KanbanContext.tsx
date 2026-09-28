import { useState } from "react";
import { createContext, useCallback, useContext, useEffect } from "react";

import type { Column, Do, Project } from "../../../db/schema";
import type { KanbanResponse } from "../../../pages/api/projects/[projectId]";

type KanbanContextValue = {
  projectId: string | null;

  project: Project | null;
  columns: Column[];
  dos: Do[];

  fetchKanban: () => Promise<void>;
  moveDo: (doId: number, columnId: number) => Promise<void>;
  editColumn: (columnId: number, name: string) => Promise<void>;
  deleteColumn: (columnId: number) => Promise<void>;

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

      if (!response.ok) {
        throw new Error("Failed to fetch Kanban");
      }

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

  const moveDo = useCallback(
    async (doId: number, columnId: number) => {
      if (!projectId) return;

      const previousDos = dos;

      setDos((currentDos) =>
        currentDos.map((doItem) =>
          doItem.id === doId
            ? {
                ...doItem,
                column_id: columnId,
              }
            : doItem,
        ),
      );

      try {
        const response = await fetch("/api/dos", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: doId,
            column_id: columnId,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as {
            error?: string;
          };

          throw new Error(data.error || "Failed to move card");
        }
      } catch (error) {
        setDos(previousDos);
        throw error;
      }
    },
    [projectId, dos],
  );

  const editColumn = useCallback(async (columnId: number, name: string) => {
    const response = await fetch(`/api/columns/${columnId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as {
        error?: string;
      };

      throw new Error(data.error || "Failed to edit column");
    }

    const data = (await response.json()) as {
      column: Column;
    };

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? data.column : column,
      ),
    );
  }, []);

  const deleteColumn = useCallback(async (columnId: number) => {
    const response = await fetch(`/api/columns/${columnId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json()) as {
        error?: string;
      };

      throw new Error(data.error || "Failed to delete column");
    }

    setColumns((currentColumns) =>
      currentColumns.filter((column) => column.id !== columnId),
    );

    setDos((currentDos) =>
      currentDos.filter((doItem) => doItem.column_id !== columnId),
    );
  }, []);

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
        moveDo,
        editColumn,
        deleteColumn,

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

  if (!context) {
    throw new Error("useKanban must be used inside a KanbanProvider");
  }

  return context;
};
