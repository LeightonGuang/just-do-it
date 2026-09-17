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
    <section className="relative h-dvh w-full">
      <div className={twMerge("size-full", className)}>{children}</div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <MasterControl />
      </div>
    </section>
  );
};

export default Workspace;
