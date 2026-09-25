import { useEffect, useState } from "react";

import { Plus, Trash, TrashOff } from "lucide-react";

import { twMerge } from "tailwind-merge";

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
    const project = projects.find((project) => project.id === id);

    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? All to-dos associated with this project will be deleted. This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
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
    <main className="dot-grid min-h-dvh p-4">
      <h1>Projects</h1>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
            className={`border bg-input px-2 py-1 ${
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
          className="h-8 w-8 cursor-pointer"
          onChange={(event) => setColour(event.target.value)}
        />

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="aspect-square border p-1"
        >
          {loading ? "Adding..." : <Plus className="size-4" />}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-2 bg-card p-2">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: project.colour }}
            />

            <a className="hover:underline" href={`/?project_id=${project.id}`}>
              {project.name}
            </a>

            <button
              type="button"
              disabled={deletingId === project.id}
              onClick={() => handleDelete(project.id)}
              className={twMerge(
                "ml-auto aspect-square border border-danger-border px-2 py-1 text-danger",
                deletingId === project.id && "cursor-not-allowed! opacity-50",
              )}
            >
              {deletingId === project.id ? (
                <TrashOff className="size-4" />
              ) : (
                <Trash className="size-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
};

export default ProjectPage;
