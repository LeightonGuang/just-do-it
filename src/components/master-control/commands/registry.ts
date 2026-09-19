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
      type: "literal";
      value: string;
    }
  | {
      type: "argument";
      argument: {
        name: string;
        placeholder: string;
        inputType: "text" | "color" | "number";
        required: boolean;
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
