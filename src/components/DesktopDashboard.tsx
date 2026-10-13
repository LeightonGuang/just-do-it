import React, { useState } from "react";

import { twMerge } from "tailwind-merge";

import Workspace from "./Workspace";
import Kanban from "./kanban/Kanban";
import DailyQuote from "./DailyQuote";
import DesktopSidebar from "./Sidebar/DesktopSidebar";
import { KanbanProvider } from "./kanban/contexts";

const DEFAULT_SIDEBAR_WIDTH = 256;

const DesktopDashboard = ({
  className,
  projectId,
  doId,
}: {
  className?: string;
  projectId: string | null;
  doId: string | null;
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

  return (
    <div
      className={twMerge("hidden h-dvh w-full overflow-hidden", className)}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      <DesktopSidebar onWidthChange={setSidebarWidth} />

      <Workspace className="">
        {projectId ? (
          <KanbanProvider projectId={projectId}>
            <Kanban doId={doId} />
          </KanbanProvider>
        ) : (
          <div className="dot-grid flex h-dvh items-center justify-center">
            <DailyQuote />
          </div>
        )}
      </Workspace>
    </div>
  );
};

export default DesktopDashboard;
