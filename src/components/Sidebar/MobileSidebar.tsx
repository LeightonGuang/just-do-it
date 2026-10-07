import { twMerge } from "tailwind-merge";

import DailyQuote from "../DailyQuote";
import DoSidebar from "./doSidebar/DoSidebar";
import ProjectsSidebar from "./ProjectsSidebar";

const MobileSidebar = ({ className }: { className?: string }) => {
  return (
    <aside className={twMerge("w-full overflow-hidden pt-4", className)}>
      <div className="h-full overflow-y-auto">
        <h1 className="mx-4 text-lg font-medium whitespace-nowrap text-orange-500 uppercase">
          <a href="/" className="hover:underline">
            Just Do it
          </a>
        </h1>

        <DailyQuote className="m-4 md:mx-0" />
        <DoSidebar />
        <ProjectsSidebar />
      </div>
    </aside>
  );
};

export default MobileSidebar;
