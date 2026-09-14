import Sidebar from "./Sidebar";
import DailyQuote from "./DailyQuote";

const Dashboard = () => {
  return (
    <div className="flex">
      <Sidebar />
      <DailyQuote />
    </div>
  );
};

export default Dashboard;
