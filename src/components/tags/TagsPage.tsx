import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { Plus, Trash, TrashOff } from "lucide-react";

import type { Tag } from "../../db/schema";

const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [colour, setColour] = useState("#000000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTags = async () => {
    const res = await fetch("/api/tags");

    if (!res.ok) {
      throw new Error("Failed to fetch tags");
    }

    const data: Tag[] = await res.json();

    setTags(data);
  };

  useEffect(() => {
    fetchTags().catch(() => {
      setError("Failed to load tags");
    });
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
      const res = await fetch("/api/tags", {
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
      setColour("#000000");

      await fetchTags();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const tag = tags.find((tag) => tag.id === id);

    if (!tag) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${tag.name}"? This will remove it from all to-dos. This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };

        setError(data.error ?? "Failed to delete tag");
        return;
      }

      setTags((current) => current.filter((tag) => tag.id !== id));
    } catch {
      setError("Failed to delete tag");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="dot-grid min-h-dvh p-4">
      <h1>Tags</h1>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex flex-col">
          <input
            type="text"
            value={name}
            disabled={loading}
            placeholder="Tag name"
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
          aria-label="Tag colour"
          className="h-8 w-8 cursor-pointer"
          onChange={(event) => {
            setColour(event.target.value);
            setError("");
          }}
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
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 bg-card p-2">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: tag.colour }}
            />

            <span>{tag.name}</span>

            <button
              type="button"
              disabled={deletingId === tag.id}
              onClick={() => handleDelete(tag.id)}
              className={twMerge(
                "ml-auto aspect-square border border-danger-border px-2 py-1 text-danger",
                deletingId === tag.id && "cursor-not-allowed! opacity-50",
              )}
            >
              {deletingId === tag.id ? (
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

export default TagsPage;
