import { useState } from "react";
import { createContext, useCallback, useContext, useEffect } from "react";

import type { Project, Do } from "../../db/schema";

export type SidebarDo = Do & {
  project_colour: string;
};

type SidebarContextValue = {
  sidebarProjects: Project[];
  sidebarDos: SidebarDo[];

  loading: boolean;
  error: string;

  fetchSidebarProjects: () => Promise<void>;
  fetchSidebarDos: () => Promise<void>;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined,
);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([]);
  const [sidebarDos, setSidebarDos] = useState<SidebarDo[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSidebarProjects = useCallback(async () => {
    const res = await fetch("/api/projects");

    if (!res.ok) throw new Error("Failed to fetch projects");

    const data: Project[] = await res.json();
    setSidebarProjects(data);
  }, []);

  const fetchSidebarDos = useCallback(async () => {
    const res = await fetch("/api/dos?sidebar=true");

    if (!res.ok) throw new Error("Failed to fetch tasks");

    const data: SidebarDo[] = await res.json();
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarProjects,
        sidebarDos,

        loading,
        error,

        fetchSidebarProjects,
        fetchSidebarDos,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context)
    throw new Error("useSidebar must be used inside ProjectsProvider");

  return context;
};
