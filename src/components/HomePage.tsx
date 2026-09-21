import Dashboard from "./Dashboard";
import { ProjectsProvider } from "./contexts/ProjectContext";

const HomePage = ({
  projectId,
  doId,
}: {
  projectId: string | null;
  doId: string | null;
}) => {
  return (
    <main className="h-dvh w-dvw">
      <ProjectsProvider>
        <Dashboard projectId={projectId} doId={doId} />
      </ProjectsProvider>
    </main>
  );
};

export default HomePage;
