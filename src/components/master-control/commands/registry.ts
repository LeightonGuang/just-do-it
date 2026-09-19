import { createDo } from "./create/do";
import { createProject } from "./create/project";
import { deleteProject } from "./delete/project";

import type { MasterControlSelectedEntity } from "./types";

export type CommandContext = {
  args: Record<string, string>;
  entities: Record<string, MasterControlSelectedEntity>;

  refetch: {
    projects: () => Promise<void>;
    dos: () => Promise<void>;
  };
};

export type CommandPart =
  | {
      type: "keyword";
      keyword: {
        value: string;
        description?: string;
        required: boolean;
      };
    }
  | {
      type: "argument";
      argument: {
        name: string;
        placeholder: string;
        required: boolean;
        kind: "text" | "color" | "number" | "entity";
        entityType?: "project" | "do" | "column";
      };
    };

export type SubCommand = {
  name: string;
  description: string;
  parts?: CommandPart[];
  execute?: (context: CommandContext) => Promise<void>;
};

export type Command = {
  command: string;
  description: string;
  subCommands?: SubCommand[];
};

export const COMMANDS: Command[] = [
  {
    command: "/create",
    description: "Create projects / dos",
    subCommands: [createProject, createDo],
  },
  {
    command: "/move",
    description: "Move dos to a different column",
    subCommands: [],
  },
  {
    command: "/delete",
    description: "Delete a project / do",
    subCommands: [deleteProject],
  },
];
