import type { CommandPart, SubCommand } from "./registry";
import type { MasterControlSelectedEntity } from "./types";

export type CommandParseResult = {
  args: Record<string, string>;
  entities: Record<string, MasterControlSelectedEntity>;
  nextPart?: CommandPart;
  complete: boolean;
};

const isHexStart = (value: string) => {
  return value.startsWith("#");
};

const isValidHexColor = (value: string) => {
  return /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(value);
};

/**
 * Parses the user's command input into arguments and determines what part
 * of the command should come next. It handles keywords, entity arguments
 * like projects, free-text values like project names, and optional hex
 * colours. It also keeps partial values while the user is typing so the
 * UI can show the appropriate hint or suggestions.
 */

export const parseCommand = (
  input: string,
  subCommand: SubCommand | undefined,
  selectedEntities: Record<string, MasterControlSelectedEntity>,
): CommandParseResult => {
  if (!subCommand?.parts?.length) {
    return {
      args: {},
      entities: selectedEntities,
      complete: true,
    };
  }

  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const argumentTokens = tokens.slice(2);

  const args: Record<string, string> = {};
  let tokenIndex = 0;

  for (let partIndex = 0; partIndex < subCommand.parts.length; partIndex++) {
    const part = subCommand.parts[partIndex];

    if (part.type === "keyword") {
      const token = argumentTokens[tokenIndex];

      if (token?.toLowerCase() === part.keyword.value.toLowerCase()) {
        tokenIndex++;
        continue;
      }

      return {
        args,
        entities: selectedEntities,
        nextPart: part,
        complete: false,
      };
    }

    const argument = part.argument;

    if (argument.kind === "entity") {
      const selected = selectedEntities[argument.name];

      if (selected) {
        args[argument.name] = selected.label;
        tokenIndex++;
        continue;
      }

      const value = argumentTokens[tokenIndex];

      if (value) {
        args[argument.name] = value;
        tokenIndex++;
      }

      if (argument.required && !value) {
        return {
          args,
          entities: selectedEntities,
          nextPart: part,
          complete: false,
        };
      }

      continue;
    }

    if (argument.kind === "text") {
      const remainingTokens = argumentTokens.slice(tokenIndex);

      const colorIndex = remainingTokens.findIndex(isHexStart);

      if (colorIndex !== -1) {
        const name = remainingTokens.slice(0, colorIndex).join(" ").trim();

        if (name) {
          args[argument.name] = name;
        }

        tokenIndex += colorIndex;

        continue;
      }

      const value = remainingTokens.join(" ").trim();

      if (value) {
        args[argument.name] = value;
        tokenIndex = argumentTokens.length;

        continue;
      }

      if (argument.required) {
        return {
          args,
          entities: selectedEntities,
          nextPart: part,
          complete: false,
        };
      }

      continue;
    }

    if (argument.kind === "color") {
      const value = argumentTokens[tokenIndex];

      if (!value) {
        return {
          args,
          entities: selectedEntities,
          nextPart: part,
          complete: true,
        };
      }

      if (!value.startsWith("#")) {
        return {
          args,
          entities: selectedEntities,
          nextPart: part,
          complete: false,
        };
      }

      args[argument.name] = value;
      tokenIndex++;

      if (!isValidHexColor(value)) {
        return {
          args,
          entities: selectedEntities,
          nextPart: part,
          complete: false,
        };
      }

      continue;
    }
  }

  for (const part of subCommand.parts) {
    if (
      part.type === "argument" &&
      part.argument.required &&
      !args[part.argument.name]
    ) {
      return {
        args,
        entities: selectedEntities,
        nextPart: part,
        complete: false,
      };
    }
  }

  return {
    args,
    entities: selectedEntities,
    complete: true,
  };
};
