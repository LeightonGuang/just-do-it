import { twMerge } from "tailwind-merge";
import { ArrowRight } from "lucide-react";

import { DoSidebarItem } from "./lib/DoSidebarItem";
import { useSidebar } from "../contexts/SidebarContext";
import { DoSidebarSkeleton } from "./lib/DoSidebarSkeleton";

const DoSidebar = ({ className }: { className?: string }) => {
  const { sidebarDos, loading } = useSidebar();

  console.log({ sidebarDos });

  return (
    <div
      className={twMerge(
        "flex min-w-0 flex-col gap-1 border-t border-border p-4 md:p-2",
        className,
      )}
    >
      <div className="items-center1 flex justify-between">
        <h2 className="text-sm">Dos</h2>

        <a
          href="/dos"
          className="flex items-center gap-1 text-[0.625rem] leading-0 text-text-muted hover:underline"
        >
          view all <ArrowRight className="size-2" />
        </a>
      </div>

      <div className="flex min-w-0 flex-col gap-y-1">
        {loading ? (
          <>
            <DoSidebarSkeleton />
            <DoSidebarSkeleton />
            <DoSidebarSkeleton />
            <DoSidebarSkeleton />
            <DoSidebarSkeleton />
          </>
        ) : (
          sidebarDos.map((doItem) => (
            <DoSidebarItem key={doItem.id} doItem={doItem} />
          ))
        )}
      </div>
    </div>
  );
};

export default DoSidebar;
