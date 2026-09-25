import { twMerge } from "tailwind-merge";

import Kanban from "./Kanban";
import MobileSidebar from "./Sidebar/MobileSidebar";

const MobileDashboard = ({
  className,
  projectId,
  doId,
}: {
  className?: string;
  projectId: string | null;
  doId: string | null;
}) => {
  return (
    <div className={twMerge("", className)}>
      <MobileSidebar />

      <Kanban doId={doId} />
    </div>
  );
};

export default MobileDashboard;
