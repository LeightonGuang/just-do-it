import Dashboard from "./Dashboard";
import { SidebarProvider } from "./contexts/SidebarContext";

const HomePage = ({
  projectId,
  doId,
}: {
  projectId: string | null;
  doId: string | null;
}) => {
  return (
    <main className="h-dvh w-dvw">
      <SidebarProvider>
        <Dashboard projectId={projectId} doId={doId} />
      </SidebarProvider>
    </main>
  );
};

export default HomePage;
