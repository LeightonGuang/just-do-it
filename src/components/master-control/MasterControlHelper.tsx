import { CircleQuestionMark } from "lucide-react";

const MasterControlHelper = () => {
  return (
    <div className="flex min-h-6 flex-1 items-center border-t border-border px-2 text-sm">
      <button className="text-text-muted">
        <CircleQuestionMark className="size-4" />
      </button>
    </div>
  );
};

export default MasterControlHelper;
  