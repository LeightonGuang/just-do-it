import { twMerge } from "tailwind-merge";
import { ArrowRight } from "lucide-react";

import { useSidebar } from "./SidebarContext";

import type { Tag } from "../../../db/schema";

const TagsSidebar = ({ className }: { className?: string }) => {
  const { sidebarTags, loading } = useSidebar();

  return (
    <div
      className={twMerge(
        "flex flex-col gap-1 border-t border-border p-4 md:p-2",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm">Tags</h2>

        <a
          href="/tags"
          className="flex items-center gap-1 text-[0.625rem] leading-0 text-text-muted hover:underline"
        >
          view all <ArrowRight className="size-2" />
        </a>
      </div>

      {loading ? (
        <>
          <TagSidebarSkeleton />
          <TagSidebarSkeleton />
          <TagSidebarSkeleton />
          <TagSidebarSkeleton />
          <TagSidebarSkeleton />
        </>
      ) : (
        sidebarTags.map((tag) => (
          <TagSidebarItem tag={tag} key={`${tag.name}-${tag.id}`} />
        ))
      )}
    </div>
  );
};

export default TagsSidebar;

const TagSidebarItem = ({ tag }: { tag: Tag }) => {
  return (
    <a
      href={`/?tag_id=${tag.id}`}
      className="flex w-max items-center gap-2 text-xs hover:brightness-95"
      style={{
        backgroundColor: `color-mix(in srgb, ${tag.colour} 15%, transparent)`,
        color: `color-mix(in srgb, ${tag.colour} 70%, black)`,
      }}
    >
      <p>{tag.name}</p>
    </a>
  );
};

const TagSidebarSkeleton = () => {
  return (
    <div className="flex items-center gap-2 bg-card p-2 md:p-1">
      <div className="size-3 shrink-0 animate-pulse rounded-full bg-border" />
      <div className="h-3 w-24 animate-pulse rounded-sm bg-border" />
    </div>
  );
};
