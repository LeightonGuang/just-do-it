import MobileDashboard from "./MobileDashboard";
import DesktopDashboard from "./DesktopDashboard";
import { KanbanProvider } from "./contexts/KanbanContext";

const Dashboard = ({
  projectId,
  doId,
}: {
  projectId: string | null;
  doId: string | null;
}) => {
  return (
    <KanbanProvider projectId={projectId}>
      {/* Mobile */}
      <MobileDashboard doId={doId} className="md:hidden" />

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
