import { createDo } from "./create/do";
import { createProject } from "./create/project";

export type CommandContext = {
  args: Record<string, string>;
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
];
