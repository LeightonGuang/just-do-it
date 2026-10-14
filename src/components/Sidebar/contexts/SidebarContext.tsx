import { useState } from "react";
import { createContext, useCallback, useContext, useEffect } from "react";

import type { Do, Project } from "../../../db";

export type SidebarTag = {
  id: number;
  name: string;
  colour: string;
};

export type SidebarDo = Omit<
  Do,
  "start_at" | "end_at" | "created_at" | "updated_at"
> & {
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;

  project_name: string;
  project_colour: string;

  tags: SidebarTag[];
};

const sortSidebarDos = (dos: SidebarDo[]) => [...dos].sort((a, b) => {
  if (a.end_at && b.end_at) return new Date(a.end_at).getTime() - new Date(b.end_at).getTime();
  if (a.end_at) return -1;
  if (b.end_at) return 1;
  return a.title.localeCompare(b.title);
}).slice(0, 5);

type SidebarContextValue = {
  sidebarProjects: Project[];
  sidebarDos: SidebarDo[];
  sidebarTags: SidebarTag[];

  loading: boolean;
  error: string;

  fetchSidebarProjects: () => Promise<void>;
  fetchSidebarDos: () => Promise<void>;
  fetchSidebarTags: () => Promise<void>;
  addSidebarProject: (project: Project) => void;
  updateSidebarProject: (projectId: number, update: Partial<Project>) => void;
  addSidebarDo: (doItem: SidebarDo) => void;
  updateSidebarDo: (doId: number, update: Partial<SidebarDo>) => void;
  removeSidebarDo: (doId: number) => void;
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
  const [sidebarTags, setSidebarTags] = useState<SidebarTag[]>([]);

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

  const fetchSidebarTags = useCallback(async () => {
    const res = await fetch("/api/tags");

    if (!res.ok) throw new Error("Failed to fetch tags");

    const data: SidebarTag[] = await res.json();

    setSidebarTags(data);
  }, []);

  const addSidebarProject = useCallback((project: Project) => {
    setSidebarProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
  }, []);

  const updateSidebarProject = useCallback((projectId: number, update: Partial<Project>) => {
    setSidebarProjects((current) => current.map((project) => project.id === projectId ? { ...project, ...update } : project));
  }, []);

  const addSidebarDo = useCallback((doItem: SidebarDo) => {
    setSidebarDos((current) => sortSidebarDos([doItem, ...current.filter((item) => item.id !== doItem.id)]));
  }, []);

  const updateSidebarDo = useCallback((doId: number, update: Partial<SidebarDo>) => {
    setSidebarDos((current) => sortSidebarDos(current.map((item) => item.id === doId ? { ...item, ...update } : item)));
  }, []);

  const removeSidebarDo = useCallback((doId: number) => {
    setSidebarDos((current) => current.filter((item) => item.id !== doId));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchSidebarProjects(),
        fetchSidebarDos(),
        fetchSidebarTags(),
      ]);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [fetchSidebarProjects, fetchSidebarDos, fetchSidebarTags]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarProjects,
        sidebarDos,
        sidebarTags,

        loading,
        error,

        fetchSidebarProjects,
        fetchSidebarDos,
        fetchSidebarTags,
        addSidebarProject,
        updateSidebarProject,
        addSidebarDo,
        updateSidebarDo,
        removeSidebarDo,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used inside SidebarProvider");
  }

  return context;
};
