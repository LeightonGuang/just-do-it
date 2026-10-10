import { useState } from 'react';
import { createContext, useCallback, useContext, useEffect } from 'react';

import type { KanbanDo, KanbanTag } from "./types";
import type { Project, Column } from "../../db/schema";

import { useEditingDo } from "./hooks";
import { useGlobalState } from "./hooks";
import { useProjectEditState } from "./hooks";

type KanbanContextValue = {
  projectId: string | null;
  project: Project | null;
  columns: Column[];
  dos: KanbanDo[];
  tags: KanbanTag[];

  fetchKanban: () => Promise<void>;
  editingDoId: number | null;
  handleEditDo: (id: number) => void;
  handleCloseDoEditor: () => void;
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
  const [dos, setDos] = useState<KanbanDo[]>([]);
  const [tags, setTags] = useState<KanbanTag[]>([]);

  const editingDo = useEditingDo();
  const projectEditState = useProjectEditState(project);
  const globalState = useGlobalState();

  const fetchKanbanData = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setColumns([]);
      setDos([]);
      setTags([]);
      globalState.resetState();
      return;
    }

    try {
      globalState.setLoading(true);
      globalState.setError("");

      const response = await fetchKanban(projectId);

      if (!response.project) {
        throw new Error("Failed to fetch Kanban");
      }

      setProject(response.project);
      setColumns(response.columns);
      setDos(response.dos);
      setTags(response.tags);
    } catch (error) {
      globalState.setError(
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      globalState.setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchKanbanData();
  }, [projectId]);

  const editProject = useCallback(
    async (name: string, colour: string) => {
      if (!projectId) return;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, colour }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to edit project");
      }

      const data = (await response.json()) as { project: Project };
      setProject(data.project);
    },
    [projectId],
  );

  const saveProject = useCallback(async () => {
    const name = projectEditState.projectName.trim();

    if (!name || globalState.savingProject) return;

    globalState.setSavingProject(true);

    try {
      await editProject(name, projectEditState.projectColour);
      await fetchKanbanData(projectId);
      projectEditState.cancelEditingProject();
    } finally {
      globalState.setSavingProject(false);
    }
  }, [projectEditState]);

  const moveDo = useCallback(
    async (doId: number, columnId: number) => {
      if (!projectId) return;

      const previousDos = dos;

      setDos((currentDos) =>
        currentDos.map((doItem) =>
          doItem.id === doId ? { ...doItem, column_id: columnId } : doItem,
        ),
      );

      try {
        const response = await fetch("/api/dos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: doId, column_id: columnId }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to move card");
        }
      } catch (error) {
        setDos(previousDos);
        throw error;
      }
    },
    [dos],
  );

  const editColumn = useCallback(async (columnId: number, name: string) => {
    const response = await fetch(`/api/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Failed to edit column");
    }

    const data = (await response.json()) as { column: Column };
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
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete column");
      }

      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnId),
      );

      setDos((currentDos) =>
        currentDos.filter((doItem) => doItem.column_id !== columnId),
      );

      editingDo.handleCloseDoEditor();
    },
    [dos],
  );

  const setColumnIsDone = useCallback(
    async (columnId: number, isDone: boolean) => {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to update column");
      }

      const data = (await response.json()) as { column: Column };

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

  return (
    <KanbanContext.Provider
      value={{
        projectId,
        project,
        columns,
        dos,
        tags,
        fetchKanban: fetchKanbanData,
        ...editingDo,
        editingProject: projectEditState.editingProject,
        projectName: projectEditState.projectName,
        projectColour: projectEditState.projectColour,
        savingProject: globalState.savingProject,
        startEditingProject: projectEditState.startEditingProject,
        cancelEditingProject: projectEditState.cancelEditingProject,
        setProjectName: projectEditState.setProjectName,
        setProjectColour: projectEditState.setProjectColour,
        saveProject,
        editProject,
        moveDo,
        editColumn,
        deleteColumn,
        setColumnIsDone,
        loading: globalState.loading,
        error: globalState.error,
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

const fetchKanban = async (projectId: string | null) => {
  if (!projectId) {
    return {
      project: null as Project | null,
      columns: [],
      dos: [],
      tags: [],
    };
  }

  const [kanbanResponse, tagsResponse] = await Promise.all([
    fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
    fetch("/api/tags", { cache: "no-store" }),
  ]);

  if (!kanbanResponse.ok) {
    throw new Error("Failed to fetch Kanban");
  }

  if (!tagsResponse.ok) {
    throw new Error("Failed to fetch tags");
  }

  const data = (await kanbanResponse.json()) as KanbanResponse;
  const tagData = (await tagsResponse.json()) as KanbanTag[];

  return {
    project: data.project,
    columns: data.columns,
    dos: data.dos.map((doItem) => ({
      ...doItem,
      tags: Array.isArray(doItem.tags) ? doItem.tags : [],
    })),
    tags: tagData,
  };
};

type KanbanResponse = {
  project: Project;
  columns: Column[];
  dos: KanbanDo[];
};
