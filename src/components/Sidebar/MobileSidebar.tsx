import { twMerge } from "tailwind-merge";

import DailyQuote from "../DailyQuote";
import DoSidebar from "./doSidebar/DoSidebar";
import ProjectsSidebar from "./ProjectsSidebar";
import SidebarUserMenu from "./SidebarUserMenu";

const MobileSidebar = ({ className }: { className?: string }) => {
  return (
    <aside className={twMerge("w-full overflow-hidden pt-4", className)}>
      <div className="h-full overflow-y-auto">
        <h1 className="px-4 py-3 text-lg font-bold whitespace-nowrap text-orange-600 uppercase tracking-wide">
          <a href="/" className="hover:underline">
            Just Do it
          </a>
        </h1>

        <DailyQuote className="m-4 md:mx-0" />
        <DoSidebar />
        <ProjectsSidebar />
        <SidebarUserMenu />
      </div>
    </aside>
  );
};

export default MobileSidebar;
