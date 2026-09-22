import { moveDo } from "./move/do";
import { createDo } from "./create/do";
import { deleteDo } from "./delete/do";
import { updateDoTitle } from "./edit/do";
import { createColumn } from "./create/column";
import { createProject } from "./create/project";
import { deleteProject } from "./delete/project";

import type { Command } from "./types";

export const COMMANDS: Command[] = [
  {
    name: "/create",
    description: "Create projects, columns, and dos",
    subCommands: [createProject, createDo, createColumn],
  },
  {
    name: "/delete",
    description: "Delete projects, columns, and dos",
    subCommands: [deleteProject, deleteDo],
  },
  {
    name: "/move",
    description: "Move dos to columns",
    subCommands: [moveDo],
  },
  {
    name: "/edit",
    description: "Edit dos",
    subCommands: [updateDoTitle],
  },
];
