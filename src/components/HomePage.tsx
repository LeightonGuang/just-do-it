import Dashboard from "./Dashboard";
import { ProjectsProvider } from "./contexts/ProjectContext";

const HomePage = ({
  projectId,
  todoId,
}: {
  projectId: string | null;
  todoId: string | null;
}) => {
  return (
    <main className="h-dvh w-dvw">
      <ProjectsProvider>
        <Dashboard projectId={projectId} todoId={todoId} />
      </ProjectsProvider>
    </main>
  );
};

export default HomePage;
