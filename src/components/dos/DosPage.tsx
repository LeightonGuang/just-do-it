import { useEffect, useState } from "react";

import { Plus, Trash, TrashOff } from "lucide-react";

import { twMerge } from "tailwind-merge";

import type { Do } from "../../db/schema";

const DosPage = () => {
  const [dos, setDos] = useState<Do[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDos = async () => {
      try {
        const res = await fetch("/api/dos");

        if (!res.ok) {
          throw new Error("Failed to fetch to-dos");
        }

        const data: Do[] = await res.json();

        setDos(data);
      } catch {
        setError("Failed to load to-dos");
      }
    };

    fetchDos();
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
      const res = await fetch("/api/dos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };

        setError(data.error ?? "Something went wrong");
        return;
      }

      const data: Do = await res.json();

      setDos((current) => [...current, data]);
      setName("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const doItem = dos.find((item) => item.id === id);

    if (!doItem) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${doItem.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(`/api/dos?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };

        setError(data.error ?? "Failed to delete to-do");
        return;
      }

      setDos((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete to-do");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="dot-grid min-h-dvh p-4">
      <h1>To-dos</h1>

      <form onSubmit={handleSubmit} className="mt-4 flex items-start gap-2">
        <div className="flex flex-col">
          <input
            type="text"
            value={name}
            disabled={loading}
            placeholder="To-do name"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            className={twMerge(
              "border bg-input px-2 py-1",
              error ? "border-danger" : "border-border",
            )}
          />

          {error && <span className="mt-1 text-sm text-danger">{error}</span>}
        </div>

        <button
          type="submit"
          aria-label="Add to-do"
          disabled={loading || !name.trim()}
          className="aspect-square border border-border p-1"
        >
          <Plus className="size-4" />
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {dos.map((doItem) => (
          <div key={doItem.id} className="flex items-center gap-2 bg-card p-2">
            <div>
              <h2 className="text-sm font-medium text-text">
                <a
                  className="hover:undeline"
                  href={`/?project_id=${doItem.project_id}&do_id=${doItem.id}`}
                >
                  {doItem.title}
                </a>
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {doItem.description}
              </p>
            </div>

            <button
              type="button"
              disabled={deletingId === doItem.id}
              aria-label={`Delete ${doItem.title}`}
              onClick={() => handleDelete(doItem.id)}
              className={twMerge(
                "ml-auto aspect-square border border-danger-border px-2 py-1 text-danger",
                deletingId === doItem.id && "cursor-not-allowed! opacity-50",
              )}
            >
              {deletingId === doItem.id ? (
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

export default DosPage;
