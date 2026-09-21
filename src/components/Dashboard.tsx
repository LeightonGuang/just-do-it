import Kanban from "./Kanban";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import DailyQuote from "./DailyQuote";
import { KanbanProvider } from "./contexts/KanbanContext";

const Dashboard = ({
  projectId,
  todoId,
}: {
  projectId: string | null;
  todoId: string | null;
}) => {
  return (
    <div className="flex">
      <Sidebar />

      <Workspace className="dot-grid flex size-full items-center justify-center">
        {projectId ? (
          <KanbanProvider projectId={projectId}>
            <Kanban projectId={projectId} todoId={todoId} />
          </KanbanProvider>
        ) : (
          <DailyQuote />
        )}
      </Workspace>
    </div>
  );
};

export default Dashboard;
