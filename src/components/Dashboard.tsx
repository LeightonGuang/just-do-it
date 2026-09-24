import { useState } from "react";

import Kanban from "./Kanban";
import Workspace from "./Workspace";
import DailyQuote from "./DailyQuote";
import DesktopSidebar from "./Sidebar/DesktopSidebar";
import { KanbanProvider } from "./contexts/KanbanContext";

const DEFAULT_SIDEBAR_WIDTH = 256;

const Dashboard = ({
  projectId,
  doId,
}: {
  projectId: string | null;
  doId: string | null;
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <KanbanProvider projectId={projectId}>Mobile</KanbanProvider>
      </div>

      {/* Desktop */}
      <div
        className="hidden h-dvh w-full overflow-hidden md:block"
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as React.CSSProperties
        }
      >
        <DesktopSidebar onWidthChange={setSidebarWidth} />

        <KanbanProvider projectId={projectId}>
          <Workspace className="dot-grid">
            {projectId ? <Kanban doId={doId} /> : <DailyQuote />}
          </Workspace>
        </KanbanProvider>
      </div>
    </>
  );
};

export default Dashboard;
