import React from "react";
import { twMerge } from "tailwind-merge";

import Kanban from "./Kanban";
import MobileSIdebar from "./Sidebar/MobileSIdebar";

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
      <MobileSIdebar />

      <Kanban doId={doId} />
    </div>
  );
};

export default MobileDashboard;
