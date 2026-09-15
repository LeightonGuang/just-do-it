import { twMerge } from "tailwind-merge";

const Workspace = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <section className="flex h-dvh w-full flex-col items-center justify-between">
      <div className={twMerge("size-full bg-red-200", className)}>
        {children}
      </div>

      <div className="my-4 flex w-2/5 flex-col overflow-hidden rounded-lg border border-border">
        <input
          placeholder="/commands, search"
          className="w-full bg-input p-2 text-sm focus:outline-none"
        />

        <div className="border-t border-border p-2 text-sm">
          some controls herel
        </div>
      </div>
    </section>
  );
};

export default Workspace;
