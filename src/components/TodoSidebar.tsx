import { twMerge } from "tailwind-merge";

const todos = [
  { id: 1, name: "Work on Todo app", project_id: 1 },
  { id: 2, name: "Groceries", project_id: 1 },
  { id: 3, name: "Gym", project_id: 1 },
];

const TodoSidebar = ({ className }: { className?: string }) => {
  return (
    <div
      className={twMerge(
        "flex flex-col gap-1 border-t border-retro-brown p-2",
        className,
      )}
    >
      <h2>Todos</h2>

      {todos.map((todo, i) => (
        <TodoSidebarItem key={`${todo.name}-${i}`} todo={todo} />
      ))}
    </div>
  );
};

export default TodoSidebar;

const TodoSidebarItem = ({ todo }: { todo: { name: string } }) => {
  return (
    <div className="bg-card p-0.5">
      <a href="">
        <span className="text-xs">{todo.name}</span>
      </a>
    </div>
  );
};
