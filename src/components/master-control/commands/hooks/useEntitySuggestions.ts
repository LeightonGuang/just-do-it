import { useEffect, useState } from "react";

import type { EntityType } from "../types";
import type { Project, Do, Column } from "../../../../db/schema";

type UseEntitySuggestionsOptions = {
  enabled: boolean;
  entityType?: EntityType;
  query: string;
};

export type EntitySuggestionsResult = {
  projects: Project[];
  dos: Do[];
  columns: Column[];
};

const useEntitySuggestions = ({
  enabled,
  entityType,
  query,
}: UseEntitySuggestionsOptions): EntitySuggestionsResult => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dos, setDos] = useState<Do[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (!enabled || !entityType) {
      setProjects([]);
      setDos([]);
      setColumns([]);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const trimmedQuery = query.trim();

        if (entityType === "project") {
          const url = trimmedQuery
            ? `/api/projects?name=${encodeURIComponent(trimmedQuery)}`
            : "/api/projects";
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data: Project[] = await res.json();
            setProjects(data);
          }
        } else if (entityType === "do") {
          const url = trimmedQuery
            ? `/api/tasks?title=${encodeURIComponent(trimmedQuery)}`
            : "/api/tasks";
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data: Do[] = await res.json();
            setDos(data);
          }
        } else if (entityType === "column") {
          const url = trimmedQuery
            ? `/api/columns?name=${encodeURIComponent(trimmedQuery)}`
            : "/api/columns";
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data: Column[] = await res.json();
            setColumns(data);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch entity suggestions:", error);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [enabled, entityType, query]);

  return { projects, dos, columns };
};

export default useEntitySuggestions;
