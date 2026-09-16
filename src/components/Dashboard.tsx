import Kanban from "./Kanban";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import DailyQuote from "./DailyQuote";

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
        {projectId ? <Kanban /> : <DailyQuote />}
      </Workspace>
    </div>
  );
};

export default Dashboard;
