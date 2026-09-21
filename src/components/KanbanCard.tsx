import type { Do } from "../db/schema";

const KanbanCard = ({
  className,
  doItem,
}: {
  className?: string;
  doItem: Do;
}) => {
  return (
    <div
      className={`border border-border bg-do p-3 transition-colors hover:cursor-grab hover:bg-do-hover active:cursor-grabbing ${className}`}
    >
      <p className="font-medium text-text">{doItem.title}</p>

      {true && (
        <p className="mt-1 text-sm text-text-muted">
          {doItem.description ||
            "lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod."}
        </p>
      )}
    </div>
  );
};

export default KanbanCard;
