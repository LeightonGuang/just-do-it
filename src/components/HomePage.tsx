import Dashboard from "./Dashboard";

const HomePage = ({
  projectId,
  todoId,
}: {
  projectId: string | null;
  todoId: string | null;
}) => {
  return (
    <main className="h-dvh w-dvw">
      <Dashboard projectId={projectId} todoId={todoId} />
    </main>
  );
};

export default HomePage;
