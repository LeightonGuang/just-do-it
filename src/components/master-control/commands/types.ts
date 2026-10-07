import type { Project, Column } from "../../../db/schema";

export type ApiTag = {
  id: number;
  name: string;
  colour: string;
};

export type ApiDo = {
  id: number;
  title: string;
  description: string | null;
  priority: "low" | "mid" | "high" | null;

  project_id: number;
  project_name: string;
  project_colour: string;

  column_id: number;

  start_at: string | Date | null;
  end_at: string | Date | null;

  created_at: string | Date;
  updated_at: string | Date;

  tags: ApiTag[];
};

export type EntityType = "project" | "do" | "column";

export type ArgumentValueType =
  "text" | "number" | "colour" | "date" | "entity";

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
  /** Whether this argument consumes multiple values, and only takes the remaining values. */
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

  /** Currently opened Kanban project, null when no project is open. */
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
  | {
      type: "command";
      value: string;
      label: string;
      description: string;
    }
  | {
      type: "sub-command";
      value: string;
      label: string;
      description: string;
    }
  | {
      type: "keyword";
      value: string;
      label: string;
      description?: string;
    }
  | {
      type: "project";
      project: Project;
    }
  | {
      type: "do";
      doItem: ApiDo;
    }
  | {
      type: "column";
      column: Column;
    };

export type MasterControlSelectedEntity = SelectedEntity;
