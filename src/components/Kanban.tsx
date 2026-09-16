const Kanban = () => {
  return (
    <section className="size-full min-h-screen border border-border p-8">
      <h1 className="mb-8 leading-4 font-medium text-text">Project Name</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <article className="border border-border bg-card p-2">
          <h2 className="leading-8 font-semibold text-text">TODO</h2>
        </article>

        <article className="border border-border bg-card p-2">
          <h2 className="leading-8 font-semibold text-text">IN PROGRESS</h2>
        </article>

        <article className="border border-border bg-card p-2">
          <h2 className="leading-8 font-semibold text-text">DONE</h2>
        </article>
      </div>
    </section>
  );
};

export default Kanban;
