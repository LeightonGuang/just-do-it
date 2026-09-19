import { TriangleAlert } from "lucide-react";

const MasterControlError = ({ error }: { error: string }) => {
  return (
    <div
      role="alert"
      className="absolute right-0 bottom-full z-50 mb-2 flex w-max items-center gap-2 border border-danger-border bg-danger-background px-3 py-2 text-xs text-danger shadow-lg"
    >
      <TriangleAlert className="size-3.5" />

      <span className="min-w-0 flex-1 leading-5">{error}</span>
    </div>
  );
};

export default MasterControlError;
