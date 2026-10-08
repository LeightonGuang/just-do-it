import { useEffect, useState } from "react";

import Tag from "./Tag";
import KanbanCard from "../kanban/KanbanCard";
import type { ApiDo } from "../master-control/commands/types";

type ApiTag = {
  id: number;
  name: string;
  colour: string;
};

type TagResponse = {
  tag: ApiTag | null;
  dos: ApiDo[];
};

const FilteredTagPage = ({ tagId }: { tagId: string }) => {
  const [tag, setTag] = useState<ApiTag | null>(null);
  const [dos, setDos] = useState<ApiDo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tags/${tagId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch todos");
        }

        const data: TagResponse = await response.json();

        setTag(data.tag);
        setDos(data.dos);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch todos",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDos();
  }, [tagId]);

  if (loading) {
    return (
      <main className="m-4">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="m-4">
        <p className="text-danger">{error}</p>
      </main>
    );
  }

  if (!tag) {
    return (
      <main className="m-4">
        <p>Tag not found.</p>
      </main>
    );
  }

  return (
    <main className="m-4">
      <div className="flex items-center gap-2">
        <h1>Todos for tag</h1>

        <Tag name={tag.name} colour={tag.colour} />
      </div>

      <div className="mt-2">
        {dos.length === 0 ? (
          <p>No todos found with this tag.</p>
        ) : (
          <div className="grid gap-3">
            {dos.map((doItem) => (
              <a href={`/?project_id=${doItem.project_id}&do_id=${doItem.id}`}>
                <KanbanCard
                  key={doItem.id}
                  doItem={doItem}
                  className="hover:cursor-pointer"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default FilteredTagPage;
