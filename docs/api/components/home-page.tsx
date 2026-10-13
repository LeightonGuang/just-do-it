import type { JSX } from "react";

interface HomePageProps {
  title: string;
  children: JSX.Element;
}

export const HomePage: React.FC<HomePageProps> = ({ title, children }) => {
  return (
    <main className="dot-grid min-h-screen text-text">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </header>
      {children}
    </main>
  );
};
