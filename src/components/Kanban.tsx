import { twMerge } from "tailwind-merge";

import KanbanCard from "./KanbanCard";
import { useKanban } from "./contexts/KanbanContext";

const Kanban = ({
  doId,
  className,
}: {
  doId: string | null;
  className?: string;
}) => {
  const { loading, error, project, columns, dos } = useKanban();

  if (loading) {
    return (
      <section className="min-h-dvh p-8">
        <p className="text-text-muted">Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-dvh p-8">
        <p className="text-danger">{error}</p>
      </section>
    );
  }

  if (!project) return null;

  return (
    <section className={twMerge("", className)}>
      <div className="dot-grid p-4 md:p-8 md:pb-24">
        <h1 className="leading-4 font-medium text-text">{project.name}</h1>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 pb-12 md:mt-8 md:gap-8 md:pb-0">
          {columns.map((column) => {
            const columnDos = dos.filter(
              (doItem) => doItem.column_id === column.id,
            );

            return (
              <article
                key={column.id}
                className="border border-border bg-card p-2"
              >
                <h2 className="leading-8 font-semibold text-text">
                  {column.name}
                </h2>

                <div className="mt-4 flex flex-col gap-2">
                  {columnDos.map((doItem) => (
                    <KanbanCard
                      key={doItem.id}
                      doItem={doItem}
                      className={twMerge(
                        Number(doId) === doItem.id && "border border-green-500",
                      )}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Kanban;
