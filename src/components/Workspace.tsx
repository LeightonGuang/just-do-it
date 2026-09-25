import { twMerge } from "tailwind-merge";

import MasterControl from "./master-control/MasterControl";

type WorkspaceProps = {
  children: React.ReactNode;
  className?: string;
};

const Workspace = ({ children, className }: WorkspaceProps) => {
  return (
    <section
      style={{
        marginLeft: "var(--sidebar-width)",
        width: "calc(100% - var(--sidebar-width))",
      }}
      className={twMerge(
        "dot-grid relative h-dvh overflow-x-hidden overflow-y-auto",
        className,
      )}
    >
      <div className="min-h-full w-full pb-16">{children}</div>

      <div
        className="pointer-events-none fixed bottom-4 z-100 flex justify-center"
        style={{
          left: "var(--sidebar-width)",
          width: "calc(100% - var(--sidebar-width))",
        }}
      >
        <div className="pointer-events-auto hidden md:block">
          <MasterControl />
        </div>
      </div>
    </section>
  );
};

export default Workspace;
