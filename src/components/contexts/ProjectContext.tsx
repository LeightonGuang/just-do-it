import { useState } from "react";
import { createContext, useCallback, useContext, useEffect } from "react";

import type { Project, Do } from "../../db/schema";

type ProjectsContextValue = {
  sidebarProjects: Project[];
  sidebarDos: Do[];

  loading: boolean;
  error: string;

  fetchSidebarProjects: () => Promise<void>;
  fetchSidebarDos: () => Promise<void>;

  addProject: (name: string, colour: string) => Promise<boolean>;
  deleteProject: (id: number) => Promise<boolean>;
};

const ProjectsContext = createContext<ProjectsContextValue | undefined>(
  undefined,
);

export const ProjectsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([]);
  const [sidebarDos, setSidebarDos] = useState<Do[]>([]);

  const [projectSuggestions, setProjectSuggestions] = useState<Project[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSidebarProjects = useCallback(async () => {
    const res = await fetch("/api/projects");

    if (!res.ok) throw new Error("Failed to fetch projects");

    const data: Project[] = await res.json();
    setSidebarProjects(data);
  }, []);

  const fetchSidebarDos = useCallback(async () => {
    const res = await fetch("/api/tasks");

    if (!res.ok) throw new Error("Failed to fetch tasks");

    const data: Do[] = await res.json();
    setSidebarDos(data);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([fetchSidebarProjects(), fetchSidebarDos()]);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [fetchSidebarProjects, fetchSidebarDos]);

  const addProject = async (name: string, colour: string): Promise<boolean> => {
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          colour,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };

        setError(data.error ?? "Failed to add project");
        return false;
      }

      await fetchSidebarProjects();

      return true;
    } catch {
      setError("Failed to add project");
      return false;
    }
  };

  const deleteProject = async (id: number): Promise<boolean> => {
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };

        setError(data.error ?? "Failed to delete project");
        return false;
      }

      setSidebarProjects((current) =>
        current.filter((project) => project.id !== id),
      );

      // Remove tasks belonging to the deleted project too.
      setSidebarDos((current) => current.filter((task) => task.id !== id));

      return true;
    } catch {
      setError("Failed to delete project");
      return false;
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <ProjectsContext.Provider
      value={{
        sidebarProjects,
        sidebarDos,

        loading,
        error,

        fetchSidebarProjects,
        fetchSidebarDos,

        addProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);

  if (!context)
    throw new Error("useProjects must be used inside ProjectsProvider");

  return context;
};
