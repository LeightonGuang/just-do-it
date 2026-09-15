import { twMerge } from "tailwind-merge";

const Workspace = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <section className="relative h-dvh w-full">
      <div className={twMerge("size-full", className)}>{children}</div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="pointer-events-auto flex h-16 w-160 flex-col overflow-hidden border border-border bg-card shadow-sm">
          <input
            placeholder="/commands, search"
            className="w-full bg-input p-2 text-sm focus:outline-none"
          />

          <div className="border-t border-border p-1 text-sm">
            some controls here
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workspace;
