import { useEffect, useState } from "react";

import type { EntityType } from "../types";
import type { Project, Do, Column } from "../../../../db/schema";

type UseEntitySuggestionsOptions = {
  enabled: boolean;
  entityType?: EntityType;
  query: string;
  projectId?: number;
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
  projectId,
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
          const params = new URLSearchParams();

          if (trimmedQuery) {
            params.set("name", trimmedQuery);
          }

          const queryString = params.toString();

          const url = queryString
            ? `/api/projects?${queryString}`
            : "/api/projects";

          const res = await fetch(url, {
            signal: controller.signal,
          });

          if (res.ok) {
            const data: Project[] = await res.json();
            setProjects(data);
          } else {
            setProjects([]);
          }
        } else if (entityType === "do") {
          const params = new URLSearchParams();

          if (trimmedQuery) {
            params.set("title", trimmedQuery);
          }

          // Your API expects project_id, not projectId
          if (projectId !== undefined) {
            params.set("project_id", String(projectId));
          }

          const queryString = params.toString();

          const url = queryString ? `/api/dos?${queryString}` : "/api/dos";

          const res = await fetch(url, {
            signal: controller.signal,
          });

          if (res.ok) {
            const data: Do[] = await res.json();
            setDos(data);
          } else {
            setDos([]);
          }
        } else if (entityType === "column") {
          const params = new URLSearchParams();

          if (trimmedQuery) {
            params.set("name", trimmedQuery);
          }

          const queryString = params.toString();

          const url = queryString
            ? `/api/columns?${queryString}`
            : "/api/columns";

          const res = await fetch(url, {
            signal: controller.signal,
          });

          if (res.ok) {
            const data: Column[] = await res.json();
            setColumns(data);
          } else {
            setColumns([]);
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
  }, [enabled, entityType, query, projectId]);

  return { projects, dos, columns };
};

export default useEntitySuggestions;
