export interface Project {
  id: number;
  name: string;
  colour: string; //hex
}

export const projects: Project[] = [
  {
    id: 1,
    name: "General",
    colour: "#006b6b",
  },
  {
    id: 2,
    name: "Work",
    colour: "#6b0039",
  },
  {
    id: 3,
    name: "Projects",
    colour: "#6b4e00",
  },
];
