import { useCallback, useState } from "react";

import type { Project } from "../../../db";

/** Hook for managing DO editing state */
type UseEditingDoOptions = {
  setCreatingDoId: (id: number | null) => void;
};

export const useEditingDo = ({ setCreatingDoId }: UseEditingDoOptions) => {
  const [editingDoId, setEditingDoId] = useState<number | null>(null);

  const handleCloseDoEditor = useCallback(() => {
    setEditingDoId(null);
  }, [setEditingDoId]);

  return {
    editingDoId,
    setEditingDoId,
    handleEditDo: useCallback((id: number) => {
      setEditingDoId(id);
    }, []),
    handleCloseDoEditor: useCallback(() => {
      setEditingDoId(null);
    }, [setEditingDoId]),
  };
}

/** Hook for managing DO creation state */
type UseCreateOptions = {
  columnId: number;
};

export const useCreateDo = ({ columnId }: UseCreateOptions) => {
  const [creatingDoId, setCreatingDoId] = useState<number | null>(null);

  const handleCloseDoEditor = useCallback(() => {
    setCreatingDoId(null);
  }, [setCreatingDoId]);

  return {
    creatingDoId,
    setCreatingDoId,
    handleCloseDoEditor: useCallback(() => {
      setCreatingDoId(null);
    }, [setCreatingDoId]),
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
  const [creatingDoId, setCreatingDoId] = useState<number | null>(null);
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  return {
    loading,
    error,
    savingProject,
    setSavingProject,
    setLoading,
    setError,
    creatingDoId,
    setCreatingDoId,
    isCreatingMode,
    setIsCreatingMode,
    resetState: useCallback(() => {
      setSavingProject(false);
      setLoading(false);
      setError("");
    }, []),
  };
};