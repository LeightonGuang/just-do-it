export interface Dos {
  id: number;
  name: string;
  project_id: number;
  project_colour: string;
  due_at: string;
}

export const dos: Dos[] = [
  {
    id: 1,
    name: "Work on Todo app",
    project_id: 2,
    project_colour: "#6b4e00",
    due_at: "2026-09-16T09:00:00",
  },
  {
    id: 2,
    name: "Groceries",
    project_id: 1,
    project_colour: "#006b6b",
    due_at: "2026-09-16T18:30:00",
  },
  {
    id: 3,
    name: "Gym",
    project_id: 1,
    project_colour: "#006b6b",
    due_at: "2026-09-17T07:30:00",
  },
  {
    id: 4,
    name: "MV Steel Group",
    project_id: 2,
    project_colour: "#6b0039",
    due_at: "2026-09-18T07:30:00",
  },
];
