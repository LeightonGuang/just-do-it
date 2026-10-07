export const DoSidebarSkeleton = () => {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-card p-2 md:p-1">
      <div className="h-3 w-3/4 animate-pulse rounded-sm bg-border" />

      <div className="flex items-center gap-2">
        <div className="size-2.5 shrink-0 animate-pulse rounded-xs bg-border" />
        <div className="h-2 w-12 animate-pulse rounded-sm bg-border" />
      </div>
    </div>
  );
};
