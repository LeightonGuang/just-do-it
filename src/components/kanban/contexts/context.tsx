import { useState, useCallback, useEffect } from 'react';
import { createContext, useContext } from 'react';

import { formatDateForApi } from "../kanbanEditDrawer/libs/formatDateForApi";

import type { KanbanDo, KanbanTag } from "./types";
import type { Project, Column } from "../../../db";

import { useDoReorder } from "./hooks";
import { useKanbanBoard } from "../hooks/useKanbanBoard";

export type CreateDoData = {
  title: string;
  project_id?: number;
  column_id?: number;
  description?: string;
  start_at?: string;
  end_at?: string;
  tags?: Array<{ id: number }>;
};

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
  creatingDoId: number | null;
  setCreatingDoId: (id: number | null) => void;
  isCreatingMode: boolean;
  setIsCreatingMode: (value: boolean) => void;
  editingColumnId: number | null;
  handleCreateDo: (data: CreateDoData) => Promise<void>;
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

  createDo: (data: CreateDoData) => Promise<void>;
  deleteDo: (doId: number) => Promise<void>;
  updateDo: (task: Partial<KanbanDo> & { id: number }) => void;

  loading: boolean;
  error: string;

  // DO reordering state and handlers
  draggedDoId: number | null;
  dragOverColumnId: number | null;
  dragOverCardId: number | null;
  dropBeforeCard: boolean;
  movingDoId: number | null;
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, id: number) => void;
  handleDragEnd: () => void;
  handleDragOver: (event: React.DragEvent<HTMLElement>, columnId: number) => void;
  handleDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLElement>, columnId: number) => Promise<void>;
  draggedColumnId: number | null;
  setDraggedColumnId: (id: number | null) => void;
  dragOverColumnForReorder: number | null;
  setDragOverColumnForReorder: (id: number | null) => void;
  handleDropColumn: (event: React.DragEvent<HTMLElement>, id: number) => Promise<void>;
  handleSaveColumn: (id: number, name: string) => Promise<void>;
  handleDeleteColumn: (id: number) => Promise<void>;
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

  // DO editing state
  const [editingDoId, setEditingDoId] = useState<number | null>(null);
  const [creatingDoId, setCreatingDoId] = useState<number | null>(null);
  const [isCreatingMode, setIsCreatingMode] = useState(false);

  // Column editing state
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);

  // Project editing state
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectColour, setProjectColour] = useState('#3b82f6');
  const [savingProject, setSavingProject] = useState(false);
  const board = useKanbanBoard({ projectId });

  // DO reordering state and handlers
  const {
    draggedDoId: doDraggedId,
    dragOverColumnId: doDragOverColumnId,
    dragOverCardId: doDragOverCardId,
    dropBeforeCard: doDropBeforeCard,
    movingDoId: doMovingDoId,
    handleDragStart: handleDoDragStart,
    handleDragEnd: handleDoDragEnd,
    handleDragOver: handleDoDragOver,
    handleDragLeave: handleDoDragLeave,
    handleDrop: handleDoDrop,
  } = useDoReorder({
    dos,
    onReordered: (updates) => {
      const byId = new Map(updates.map((update) => [update.id, update]));
      setDos((currentDos) =>
        currentDos.map((item) => {
          const update = byId.get(item.id);
          return update
            ? { ...item, column_id: update.column_id, position: update.position }
            : item;
        }),
      );
    },
  });

  const handleCloseDoEditor = useCallback(() => {
    setEditingDoId(null);
  }, []);

  const cancelEditingProject = useCallback(() => {
    setEditingProject(false);
  }, []);

  // Handle creating a new DO through the create mode button
  const handleCreateDo = useCallback(
    async (data: CreateDoData & { tags?: KanbanTag[] }) => {
      if (!projectId) return;

      try {
        await fetch("/api/dos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            description: data.description || undefined,
            start_at: data.start_at ? formatDateForApi(data.start_at) : undefined,
            end_at: data.end_at ? formatDateForApi(data.end_at) : undefined,
            project_id: Number(projectId),
            column_id: data.column_id ? Number(data.column_id) : undefined,
            tags: data.tags || [],
          }),
        });

        await fetchKanbanData();
        handleCloseDoEditor();
        setCreatingDoId(null);
        setIsCreatingMode(false);
      } catch (error) {
        console.error("Failed to create task:", error);
        throw error;
      }
    },
    [projectId, handleCloseDoEditor],
  );

  const fetchKanbanData = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setColumns([]);
      setDos([]);
      setTags([]);
      return;
    }

    try {
      const [response, tagsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
        fetch("/api/tags", { cache: "no-store" }),
      ]);

      if (!response.ok) {
        throw new Error("Failed to fetch Kanban");
      }
      if (!tagsResponse.ok) {
        throw new Error("Failed to fetch tags");
      }

      const data = (await response.json()) as {
        project: Project;
        columns: Column[];
        dos: KanbanDo[];
      };

      setProject(data.project);
      setColumns(data.columns || []);
      setDos(data.dos || []);
      setTags((await tagsResponse.json()) as KanbanTag[]);
    } catch (error) {
      console.error("Failed to fetch Kanban:", error);
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
    const name = projectName.trim();

    if (!name) return;

    setSavingProject(true);

    try {
      await editProject(name, projectColour);
      await fetchKanbanData();
      cancelEditingProject();
    } finally {
      setSavingProject(false);
    }
  }, [projectName, projectColour]);

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
        const response = await fetch(`/api/dos/${doId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ column_id: columnId, position: 0 }),
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

      handleCloseDoEditor();
    },
    [],
  );

  const createDo = useCallback(
    async (data: CreateDoData) => {
      if (!projectId) return;

      try {
        const response = await fetch("/api/dos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to create task");
        }

        await fetchKanbanData();
      } catch (error) {
        console.error("Failed to create task:", error);
      }
    },
    [projectId, fetchKanbanData],
  );

  const deleteDo = useCallback(
    async (doId: number) => {
      const response = await fetch(`/api/dos/${doId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete task");
      }

      // Remove the task from state so the UI updates immediately.
      setDos((currentDos) =>
        currentDos.filter((doItem) => doItem.id !== doId),
      );
    },
    [],
  );

  const updateDo = useCallback((task: Partial<KanbanDo> & { id: number }) => {
    setDos((currentDos) =>
      currentDos.map((currentDo) =>
        currentDo.id === task.id ? { ...currentDo, ...task } : currentDo,
      ),
    );
  }, []);

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
      columns: data.columns || [],
      dos: data.dos || [],
      tags: tagData || [],
    };
  };

  return (
    <KanbanContext.Provider
      value={{
        projectId,
        project,
        columns,
        dos,
        tags,
        fetchKanban: fetchKanbanData,
        editingDoId,
        editingProject,
        handleEditDo: setEditingDoId,
        handleCloseDoEditor,
        creatingDoId,
        setCreatingDoId,
        editingColumnId,
        isCreatingMode,
        setIsCreatingMode,
        handleCreateDo,
        projectName,
        projectColour,
        savingProject,
        startEditingProject: () => setEditingProject(true),
        cancelEditingProject,
        setProjectName,
        setProjectColour,
        saveProject,
        editProject,
        moveDo,
        editColumn,
        deleteColumn,
        setColumnIsDone,
        createDo,
        deleteDo,
        updateDo,
        loading: false,
        error: "",
        // DO reordering
        draggedDoId: doDraggedId,
        dragOverColumnId: doDragOverColumnId,
        dragOverCardId: doDragOverCardId,
        dropBeforeCard: doDropBeforeCard,
        movingDoId: doMovingDoId,
        handleDragStart: handleDoDragStart,
        handleDragEnd: handleDoDragEnd,
        handleDragOver: handleDoDragOver,
        handleDragLeave: handleDoDragLeave,
        handleDrop: handleDoDrop,
        draggedColumnId: board.draggedColumnId,
        setDraggedColumnId: board.setDraggedColumnId,
        dragOverColumnForReorder: board.dragOverColumnForReorder,
        setDragOverColumnForReorder: board.setDragOverColumnForReorder,
        handleDropColumn: board.handleDropColumn,
        handleSaveColumn: board.handleSaveColumn,
        handleDeleteColumn: board.handleDeleteColumn,
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

type KanbanResponse = {
  project: Project;
  columns: Column[];
  dos: KanbanDo[];
  tags: KanbanTag[];
};
