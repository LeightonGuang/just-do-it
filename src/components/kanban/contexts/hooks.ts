import { useCallback, useState } from "react";

import type { KanbanDo } from "./types";
import type { Project } from "../../../../db/schema";

/** Hook for managing DO editing state */
export const useEditingDo = () => {
  const [editingDoId, setEditingDoId] = useState<number | null>(null);

  return {
    editingDoId,
    handleEditDo: useCallback((id: number) => {
      setEditingDoId(id);
    }, []),
    handleCloseDoEditor: useCallback(() => {
      setEditingDoId(null);
    }, []),
  };
};

/** Hook for managing project editing state */
export const useProjectEditState = (project: Project | null) => {
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColour, setProjectColour] = useState("#000000");

  return {
    editingProject,
    projectName,
    projectColour,
    setEditingProject,
    setProjectName,
    setProjectColour,
    startEditingProject: useCallback(() => {
      if (!project) return;

      setProjectName(project.name);
      setProjectColour(project.colour);
      setEditingProject(true);
    }, [project]),
    cancelEditingProject: useCallback(() => {
      if (project) {
        setProjectName(project.name);
        setProjectColour(project.colour);
      }
      setEditingProject(false);
    }, [project]),
  };
};

/** Hook for managing global state (saving/loading/error) */
export const useGlobalState = () => {
  const [savingProject, setSavingProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  return { loading, error, savingProject, setSavingProject, setLoading, setError };
};