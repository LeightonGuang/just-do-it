import { twMerge } from "tailwind-merge";
import { ArrowRight } from "lucide-react";

import Tag from "../../tags/Tag";
import { useSidebar } from "./SidebarContext";
import { useTheme } from "../../../hooks/useTheme";

const TagsSidebar = ({ className }: { className?: string }) => {
  const theme = useTheme();
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

      <div className="flex gap-2">
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
            <a href={`/tags?id=${tag.id}`} key={`${tag.name}-${tag.id}`}>
              <Tag name={tag.name} colour={tag.colour} theme={theme} />
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default TagsSidebar;

const TagSidebarSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={twMerge(
        "inline-flex h-4 w-10 animate-pulse rounded-full border border-border bg-border",
        className,
      )}
    />
  );
};
