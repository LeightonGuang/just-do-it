import { twMerge } from "tailwind-merge";

import DoSidebar from "./DoSidebar";
import DailyQuote from "../DailyQuote";
import ProjectsSidebar from "./ProjectsSidebar";

const MobileSIdebar = ({ className }: { className?: string }) => {
  return (
    <aside className={twMerge("w-full mb-4", className)}>
      <DoSidebar />
      <ProjectsSidebar />
      <DailyQuote className="mx-4 md:mx-0" />
    </aside>
  );
};

export default MobileSIdebar;
