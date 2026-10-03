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

  // Task editor
  editingDoId: number | null;
  handleEditDo: (id: number) => void;
  handleCloseDoEditor: () => void;

  // Project editing
  editingProject: boolean;
  projectName: string;
  projectColour: string;
  savingProject: boolean;

  startEditingProject: () => void;
  cancelEditingProject: () => void;
  setProjectName: (name: string) => void;
  setProjectColour: (colour: string) => void;
  saveProject: () => Promise<void>;

  editProject: (name: string, colour: string) => Promise<void>;

  moveDo: (doId: number, columnId: number) => Promise<void>;
  editColumn: (columnId: number, name: string) => Promise<void>;
  deleteColumn: (columnId: number) => Promise<void>;
  setColumnIsDone: (columnId: number, isDone: boolean) => Promise<void>;

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

  // Task editor state
  const [editingDoId, setEditingDoId] = useState<number | null>(null);

  const handleEditDo = useCallback((id: number) => {
    setEditingDoId(id);
  }, []);

  const handleCloseDoEditor = useCallback(() => {
    setEditingDoId(null);
  }, []);

  // Project editing state
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColour, setProjectColour] = useState("#000000");
  const [savingProject, setSavingProject] = useState(false);

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

  const editProject = useCallback(
    async (name: string, colour: string) => {
      if (!projectId) return;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          colour,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          error?: string;
        };

        throw new Error(data.error || "Failed to edit project");
      }

      const data = (await response.json()) as {
        project: Project;
      };

      setProject(data.project);
    },
    [projectId],
  );

  const startEditingProject = useCallback(() => {
    if (!project) return;

    setProjectName(project.name);
    setProjectColour(project.colour);
    setEditingProject(true);
  }, [project]);

  const cancelEditingProject = useCallback(() => {
    if (savingProject) return;

    if (project) {
      setProjectName(project.name);
      setProjectColour(project.colour);
    }

    setEditingProject(false);
  }, [project, savingProject]);

  const saveProject = useCallback(async () => {
    const name = projectName.trim();

    if (!name || savingProject) return;

    setSavingProject(true);

    try {
      await editProject(name, projectColour);

      await fetchKanban();

      setEditingProject(false);
    } finally {
      setSavingProject(false);
    }
  }, [projectName, projectColour, savingProject, editProject, fetchKanban]);

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

  const deleteColumn = useCallback(
    async (columnId: number) => {
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

      setEditingDoId((currentId) => {
        if (currentId === null) return null;

        const deletedDo = dos.some(
          (doItem) => doItem.id === currentId && doItem.column_id === columnId,
        );

        return deletedDo ? null : currentId;
      });
    },
    [dos],
  );

  const setColumnIsDone = useCallback(
    async (columnId: number, isDone: boolean) => {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDone,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          error?: string;
        };

        throw new Error(data.error || "Failed to update column");
      }

      const data = (await response.json()) as {
        column: Column;
      };

      setColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.project_id === data.column.project_id
            ? {
                ...column,
                is_done: column.id === data.column.id ? isDone : false,
              }
            : column,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  useEffect(() => {
    setEditingProject(false);
    setProjectName("");
    setProjectColour("#000000");
    setEditingDoId(null);
  }, [projectId]);

  return (
    <KanbanContext.Provider
      value={{
        projectId,

        project,
        columns,
        dos,

        fetchKanban,

        editingDoId,
        handleEditDo,
        handleCloseDoEditor,

        editingProject,
        projectName,
        projectColour,
        savingProject,

        startEditingProject,
        cancelEditingProject,
        setProjectName,
        setProjectColour,
        saveProject,

        editProject,

        moveDo,
        editColumn,
        deleteColumn,
        setColumnIsDone,

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
