import { createContext, useContext } from "react";
import { useState, useCallback, useEffect } from "react";

import { useDoReorder } from "./hooks";
import { useKanbanBoard } from "../hooks/useKanbanBoard";
import { useSidebar } from "../../Sidebar/contexts/SidebarContext";
import { formatDateForApi } from "../kanbanEditDrawer/libs/formatDateForApi";

import type { KanbanDo, KanbanTag } from "./types";
import type { Project, Column } from "../../../db";
import type { SidebarDo } from "../../Sidebar/contexts/SidebarContext";

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
  handleDragOver: (
    event: React.DragEvent<HTMLElement>,
    columnId: number,
  ) => void;
  handleDragLeave: (event: React.DragEvent<HTMLElement>) => void;
  handleDrop: (
    event: React.DragEvent<HTMLElement>,
    columnId: number,
  ) => Promise<void>;
  draggedColumnId: number | null;
  setDraggedColumnId: (id: number | null) => void;
  dragOverColumnForReorder: number | null;
  setDragOverColumnForReorder: (id: number | null) => void;
  handleDropColumn: (
    event: React.DragEvent<HTMLElement>,
    id: number,
  ) => Promise<void>;
  handleSaveColumn: (id: number, name: string) => Promise<void>;
  addColumn: () => void;
  cancelColumn: (columnId: number) => void;
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
  const [projectName, setProjectName] = useState("");
  const [projectColour, setProjectColour] = useState("#3b82f6");
  const [savingProject, setSavingProject] = useState(false);
  const board = useKanbanBoard({
    projectId,
    onDeleted: (columnId) => {
      setColumns((current) => current.filter((column) => column.id !== columnId));
      setDos((current) => current.filter((doItem) => doItem.column_id !== columnId));
      handleCloseDoEditor();
    },
  });
  const { addSidebarDo, updateSidebarDo, removeSidebarDo, updateSidebarProject } = useSidebar();

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
            ? {
                ...item,
                column_id: update.column_id,
                position: update.position,
              }
            : item;
        }),
      );

      const movedUpdate = updates.find((update) => update.id === doDraggedId);
      const targetColumn = movedUpdate
        ? columns.find((column) => column.id === movedUpdate.column_id)
        : undefined;
      if (movedUpdate && targetColumn?.is_done) {
        removeSidebarDo(movedUpdate.id);
      } else if (movedUpdate) {
        const movedDo = dos.find((item) => item.id === movedUpdate.id);
        if (movedDo && project) {
          addSidebarDo({
            ...movedDo,
            column_id: movedUpdate.column_id,
            position: movedUpdate.position,
            project_name: project.name,
            project_colour: project.colour,
            start_at: movedDo.start_at ?? null,
            end_at: movedDo.end_at ?? null,
            created_at: movedDo.created_at,
            updated_at: movedDo.updated_at,
            tags: movedDo.tags ?? [],
          });
        } else {
          updateSidebarDo(movedUpdate.id, {
            column_id: movedUpdate.column_id,
            position: movedUpdate.position,
          });
        }
      }
    },
  });

  const handleCloseDoEditor = useCallback(() => {
    setEditingDoId(null);
    setCreatingDoId(null);
    setIsCreatingMode(false);
  }, []);

  const cancelEditingProject = useCallback(() => {
    setEditingProject(false);
  }, []);

  // Handle creating a new DO through the create mode button
  const handleCreateDo = useCallback(
    async (data: CreateDoData) => {
      if (!projectId) return;

      try {
        const response = await fetch("/api/dos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            description: data.description || undefined,
            start_at: data.start_at
              ? formatDateForApi(data.start_at)
              : undefined,
            end_at: data.end_at ? formatDateForApi(data.end_at) : undefined,
            project_id: Number(projectId),
            column_id: data.column_id ? Number(data.column_id) : undefined,
            tags: data.tags || [],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        const result = (await response.json()) as {
          task?: {
            id: number;
            title: string;
            description: string | null;
            project_id: number;
            column_id: number;
            position: number | null;
            start_at: string | null;
            end_at: string | null;
            created_at: string;
            updated_at: string;
            tags?: SidebarDo["tags"];
          };
        };

        if (result.task && project) {
          addSidebarDo({
            ...result.task,
            project_name: project.name,
            project_colour: project.colour,
            tags: result.task.tags ?? [],
          });
        }

        await fetchKanbanData();
        handleCloseDoEditor();
        setCreatingDoId(null);
        setIsCreatingMode(false);
      } catch (error) {
        console.error("Failed to create task:", error);
        throw error;
      }
    },
    [projectId, project, addSidebarDo, handleCloseDoEditor],
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
      setProjectName(data.project.name);
      setProjectColour(data.project.colour);
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

      const updatedProject = (await response.json()) as Project;
      setProject(updatedProject);
      setProjectName(updatedProject.name);
      setProjectColour(updatedProject.colour);
      updateSidebarProject(updatedProject.id, {
        name: updatedProject.name,
        colour: updatedProject.colour,
      });
    },
    [projectId, updateSidebarProject],
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

  const addColumn = useCallback(() => {
    if (!projectId) return;
    const temporaryId = -Date.now();
    setColumns((current) => [
      ...current,
      {
        id: temporaryId,
        project_id: Number(projectId),
        name: "New column",
        position: current.length,
        is_done: false,
      },
    ]);
    setEditingColumnId(temporaryId);
  }, [projectId]);

  const cancelColumn = useCallback((columnId: number) => {
    if (columnId >= 0) return;
    setColumns((current) => current.filter((column) => column.id !== columnId));
    setEditingColumnId((current) => current === columnId ? null : current);
  }, []);

  const saveColumn = useCallback(async (columnId: number, name: string) => {
    if (columnId < 0) {
      const response = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, project_id: Number(projectId), position: columns.length - 1 }),
      });
      if (!response.ok) throw new Error("Failed to create column");
      const data = (await response.json()) as { column: Column };
      setColumns((current) => current.map((column) => column.id === columnId ? data.column : column));
      setEditingColumnId(null);
      return;
    }
    await editColumn(columnId, name);
    setEditingColumnId(null);
  }, [columns.length, editColumn, projectId]);

  const deleteColumn = useCallback(async (columnId: number) => {
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
  }, []);

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

  const deleteDo = useCallback(async (doId: number) => {
    const response = await fetch(`/api/dos/${doId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Failed to delete task");
    }

    // Remove the task from state so the UI updates immediately.
    setDos((currentDos) => currentDos.filter((doItem) => doItem.id !== doId));
  }, []);

  const updateDo = useCallback(
    (task: Partial<KanbanDo> & { id: number }) => {
      setDos((currentDos) =>
        currentDos.map((currentDo) =>
          currentDo.id === task.id ? { ...currentDo, ...task } : currentDo,
        ),
      );
      updateSidebarDo(task.id, task as Parameters<typeof updateSidebarDo>[1]);
    },
    [updateSidebarDo],
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
        startEditingProject: () => {
          if (project) {
            setProjectName(project.name);
            setProjectColour(project.colour);
          }
          setEditingProject(true);
        },
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
        handleSaveColumn: saveColumn,
        handleDeleteColumn: board.handleDeleteColumn,
        addColumn,
        cancelColumn,
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
