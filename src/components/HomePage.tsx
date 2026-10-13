import Dashboard from "./Dashboard";
import { SidebarProvider } from "./Sidebar/contexts/SidebarContext";
import { useEffect, useState } from "react";

const HomePage = ({
  projectId,
  doId,
}: {
  projectId: string | null;
  doId: string | null;
}) => {
  const [route, setRoute] = useState({ projectId, doId });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setRoute({
        projectId: params.get("project_id"),
        doId: params.get("do_id"),
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <main className="h-dvh w-dvw">
      <SidebarProvider>
        <Dashboard projectId={route.projectId} doId={route.doId} />
      </SidebarProvider>
    </main>
  );
};

export default HomePage;
