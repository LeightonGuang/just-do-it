import Kanban from "./Kanban";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import DailyQuote from "./DailyQuote";
import { KanbanProvider } from "./contexts/KanbanContext";

const Dashboard = ({
  projectId,
  doId,
}: {
  projectId: string | null;
  doId: string | null;
}) => {
  return (
    <div className="flex">
      <Sidebar />

      <Workspace className="dot-grid flex size-full items-center justify-center">
        {projectId ? (
          <KanbanProvider projectId={projectId}>
            <Kanban doId={doId} />
          </KanbanProvider>
        ) : (
          <DailyQuote />
        )}
      </Workspace>
    </div>
  );
};

export default Dashboard;
