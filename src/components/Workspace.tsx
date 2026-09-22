import { twMerge } from "tailwind-merge";

import MasterControl from "./master-control/MasterControl";

const Workspace = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <section className="relative min-h-dvh w-full">
      <div className={twMerge("w-full", className)}>{children}</div>

      <div className="pointer-events-none sticky bottom-4 z-50 flex justify-center">
        <div className="pointer-events-auto">
          <MasterControl />
        </div>
      </div>
    </section>
  );
};

export default Workspace;
