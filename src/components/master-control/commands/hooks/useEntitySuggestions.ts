import { useEffect, useState } from "react";

import type { EntityType } from "../types";
import type { Project, Do, Column } from "../../../../db/schema";

type UseEntitySuggestionsOptions = {
  enabled: boolean;
  entityType?: EntityType;
  query: string;
  projectId?: number;
  projectQuery?: string;
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
  projectQuery,
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
        const trimmedProjectQuery = projectQuery?.trim() ?? "";

        /*
         * PROJECT SUGGESTIONS
         */
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

          if (!res.ok) {
            setProjects([]);
            return;
          }

          const data: Project[] = await res.json();
          setProjects(data);
          return;
        }

        if (entityType === "do") {
          let resolvedProjectId = projectId;

          if (resolvedProjectId === undefined && trimmedProjectQuery) {
            const projectParams = new URLSearchParams();
            projectParams.set("name", trimmedProjectQuery);

            const projectRes = await fetch(
              `/api/projects?${projectParams.toString()}`,
              {
                signal: controller.signal,
              },
            );

            if (projectRes.ok) {
              const matchingProjects: Project[] = await projectRes.json();

              /*
               * Prefer an exact project-name match.
               */
              const exactMatch = matchingProjects.find(
                (project) =>
                  project.name.toLowerCase() ===
                  trimmedProjectQuery.toLowerCase(),
              );

              resolvedProjectId = exactMatch?.id ?? matchingProjects[0]?.id;
            }
          }

          const params = new URLSearchParams();

          if (trimmedQuery) {
            params.set("title", trimmedQuery);
          }

          if (resolvedProjectId !== undefined) {
            params.set("project_id", String(resolvedProjectId));
          }

          const queryString = params.toString();

          const url = queryString ? `/api/dos?${queryString}` : "/api/dos";

          const res = await fetch(url, {
            signal: controller.signal,
          });

          if (!res.ok) {
            setDos([]);
            return;
          }

          const data: Do[] = await res.json();
          setDos(data);
          return;
        }

        /*
         * COLUMN SUGGESTIONS
         */
        if (entityType === "column") {
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

          if (!res.ok) {
            setColumns([]);
            return;
          }

          const data: Column[] = await res.json();
          setColumns(data);
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
  }, [enabled, entityType, query, projectId, projectQuery]);

  return {
    projects,
    dos,
    columns,
  };
};

export default useEntitySuggestions;
