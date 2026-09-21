import type { Do } from "../db/schema";

const KanbanCard = ({
  className,
  doItem,
}: {
  className?: string;
  doItem: Do;
}) => {
  return (
    <div className={`border border-border bg-do p-3 transition-colors hover:bg-do-hover ${className}`}>
      <p className="font-medium text-text">{doItem.title}</p>

      {doItem.description && (
        <p className="mt-1 text-sm text-text-muted">{doItem.description}</p>
      )}
    </div>
  );
};

export default KanbanCard;
