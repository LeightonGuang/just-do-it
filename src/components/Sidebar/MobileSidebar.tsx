import { twMerge } from "tailwind-merge";

import DoSidebar from "./DoSidebar";
import DailyQuote from "../DailyQuote";
import ProjectsSidebar from "./ProjectsSidebar";

const MobileSidebar = ({ className }: { className?: string }) => {
  return (
    <aside className={twMerge("mb-4 w-full", className)}>
      <h1 className="m-4 text-lg font-medium whitespace-nowrap text-orange-500 uppercase">
        <a href="/" className="hover:underline">
          Just Do it
        </a>
      </h1>

      <DailyQuote className="m-4 md:mx-0" />
      <DoSidebar />
      <ProjectsSidebar />
    </aside>
  );
};

export default MobileSidebar;
