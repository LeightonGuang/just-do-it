import type { SubCommand } from "../registry";

export const createDo: SubCommand = {
  name: "do",
  description: "Create a new do",

  parts: [
    {
      type: "argument",
      argument: {
        name: "name",
        placeholder: "Do name",
        required: true,
        kind: "text",
      },
    },

    {
      type: "keyword",
      keyword: {
        value: "in",
        description: "Select the project",
        required: true,
      },
    },

    {
      type: "argument",
      argument: {
        name: "project",
        placeholder: "Project",
        required: true,
        kind: "entity",
        entityType: "project",
      },
    },
  ],

  execute: async ({ args, entities }) => {
    const project = entities.project;

    console.log(args.name);
    console.log(project);
  },
};
