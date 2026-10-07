import { useState } from "react";
import { createContext, useCallback, useContext, useEffect } from "react";

import type { Do, Project, Tag } from "../../../db/schema";

export type SidebarDo = Omit<
  Do,
  "start_at" | "end_at" | "created_at" | "updated_at"
> & {
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  project_colour: string;
  tags: Tag[];
};

type SidebarContextValue = {
  sidebarProjects: Project[];
  sidebarDos: SidebarDo[];
  sidebarTags: Tag[];

  loading: boolean;
  error: string;

  fetchSidebarProjects: () => Promise<void>;
  fetchSidebarDos: () => Promise<void>;
  fetchSidebarTags: () => Promise<void>;
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
  const [sidebarTags, setSidebarTags] = useState<Tag[]>([]);

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

    const data: Tag[] = await res.json();

    setSidebarTags(data);
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
