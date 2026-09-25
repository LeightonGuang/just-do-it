import { useState } from "react";

import MobileDashboard from "./MobileDashboard";
import DesktopDashboard from "./DesktopDashboard";
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
    <KanbanProvider projectId={projectId}>
      {/* Mobile */}
      <MobileDashboard
        doId={doId}
        projectId={projectId}
        className="md:hidden"
      />

      {/* Desktop */}
      <DesktopDashboard
        doId={doId}
        projectId={projectId}
        className="hidden md:block"
      />
    </KanbanProvider>
  );
};

export default Dashboard;
