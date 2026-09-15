import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import DailyQuote from "./DailyQuote";

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />

      <Workspace className="flex size-full items-center justify-center">
        <DailyQuote />
      </Workspace>
    </div>
  );
};

export default Dashboard;
