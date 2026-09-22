import { useState } from "react";

import Kanban from "./Kanban";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import DailyQuote from "./DailyQuote";
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
    <div
      className="h-dvh w-full overflow-hidden"
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      <Sidebar onWidthChange={setSidebarWidth} />

      <KanbanProvider projectId={projectId}>
        <Workspace className="dot-grid">
          {projectId ? <Kanban doId={doId} /> : <DailyQuote />}
        </Workspace>
      </KanbanProvider>
    </div>
  );
};

export default Dashboard;
