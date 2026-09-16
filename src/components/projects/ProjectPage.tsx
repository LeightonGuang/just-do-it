import { useEffect, useState } from "react";

import type { Project } from "../../db/schema";

const ProjectPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [colour, setColour] = useState("#000000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchProjects = async () => {
    const res = await fetch("/api/projects");
    const data: Project[] = await res.json();

    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);

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

        setError(data.error ?? "Something went wrong");
        return;
      }

      setName("");
      await fetchProjects();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
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
        return;
      }

      setProjects((current) => current.filter((project) => project.id !== id));
    } catch {
      setError("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main>
      <h1>Projects</h1>

      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <div className="flex flex-col">
          <input
            type="text"
            value={name}
            disabled={loading}
            placeholder="Project name"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            className={`border px-2 py-1 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />

          {error && <span className="mt-1 text-sm text-red-500">{error}</span>}
        </div>

        <input
          type="color"
          value={colour}
          disabled={loading}
          aria-label="Project colour"
          className="h-9 w-9 cursor-pointer"
          onChange={(event) => setColour(event.target.value)}
        />

        <button
          type="submit"
          className="border px-2 py-1"
          disabled={loading || !name.trim()}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.colour }}
            />

            <span>{project.name}</span>

            <button
              type="button"
              disabled={deletingId === project.id}
              onClick={() => handleDelete(project.id)}
              className="ml-auto border border-danger-border px-2 py-1 text-danger"
            >
              {deletingId === project.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
};

export default ProjectPage;
