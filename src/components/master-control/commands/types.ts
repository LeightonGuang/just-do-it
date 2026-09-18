import type { Project } from "../../../db/schema";

export type CommandSuggestion = {
  type: "command";
  value: string;
  label: string;
  description: string;
};

export type SubCommandSuggestion = {
  type: "sub-command";
  value: string;
  label: string;
  description: string;
};

export type ProjectSuggestion = {
  type: "project";
  project: Project;
};

export type MasterControlSuggestion =
  CommandSuggestion | SubCommandSuggestion | ProjectSuggestion;
