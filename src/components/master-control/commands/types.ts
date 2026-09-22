import type { Project, Do, Column } from "../../../db/schema";

export type EntityType = "project" | "do" | "column";

export type ArgumentValueType = "text" | "number" | "color" | "date" | "entity";

export type KeywordPart = {
  type: "keyword";
  value: string;
  /** Whether this keyword can be omitted from the command. */
  optional?: boolean;
};

export type ArgumentPart = {
  type: "argument";
  name: string;
  placeholder?: string;
  valueType: ArgumentValueType;
  entityType?: EntityType;
  required?: boolean;
  /** Whether this argument consumes multiple values, and only take the remaining values.  */
  greedy?: boolean;
};

export type CommandPart = KeywordPart | ArgumentPart;

export type SelectedEntity = {
  type: EntityType;
  id: number;
  label: string;
  raw?: unknown;
};

export type CommandContext = {
  args: Record<string, string>;
  entities: Record<string, SelectedEntity>;
  /** Currently opened Kanban project, null when no project is open.  */
  projectId: string | null;
  refetch: {
    projects: () => Promise<void>;
    dos: () => Promise<void>;
    kanban?: () => Promise<void>;
  };
};

export type CommandExecute = (context: CommandContext) => Promise<void>;

export type SubCommand = {
  name: string;
  description: string;
  parts: CommandPart[];
  execute: CommandExecute;
};

export type Command = {
  name: string;
  description: string;
  subCommands: SubCommand[];
};

export type MasterControlSuggestion =
  | { type: "command"; value: string; label: string; description: string }
  | { type: "sub-command"; value: string; label: string; description: string }
  | { type: "keyword"; value: string; label: string; description?: string }
  | { type: "project"; project: Project }
  | { type: "do"; doItem: Do }
  | { type: "column"; column: Column };

export type MasterControlSelectedEntity = SelectedEntity;
