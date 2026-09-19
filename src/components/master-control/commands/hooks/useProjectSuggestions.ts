import { useEffect, useState } from "react";

import type { Project } from "../../../../db/schema";

type UseProjectSuggestionsOptions = {
  enabled: boolean;
  query: string;
};

const useProjectSuggestions = ({
  enabled,
  query,
}: UseProjectSuggestionsOptions) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!enabled) {
      setProjects([]);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const trimmedQuery = query.trim();

        const url = trimmedQuery
          ? `/api/projects?name=${encodeURIComponent(trimmedQuery)}`
          : "/api/projects";

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch project suggestions");
        }

        const data: Project[] = await response.json();

        setProjects(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch project suggestions:", error);
        setProjects([]);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [enabled, query]);

  return projects;
};

export default useProjectSuggestions;
