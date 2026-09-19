import type { CommandPart, SubCommand } from "./registry";
import type { MasterControlSelectedEntity } from "./types";

export type CommandParseResult = {
  args: Record<string, string>;
  entities: Record<string, MasterControlSelectedEntity>;
  nextPart?: CommandPart;
  complete: boolean;
};

const findLastKeywordIndex = (
  tokens: string[],
  keyword: string,
  startIndex: number,
) => {
  const normalizedKeyword = keyword.toLowerCase();

  for (let index = tokens.length - 1; index >= startIndex; index--) {
    if (tokens[index].toLowerCase() === normalizedKeyword) {
      return index;
    }
  }

  return -1;
};

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
      const currentToken = argumentTokens[tokenIndex];

      if (currentToken?.toLowerCase() === part.keyword.value.toLowerCase()) {
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

    const nextPart = subCommand.parts[partIndex + 1];

    if (nextPart?.type === "keyword" && tokenIndex < argumentTokens.length) {
      const keywordIndex = findLastKeywordIndex(
        argumentTokens,
        nextPart.keyword.value,
        tokenIndex,
      );

      if (keywordIndex !== -1) {
        const value = argumentTokens
          .slice(tokenIndex, keywordIndex)
          .join(" ")
          .trim();

        if (value) {
          args[part.argument.name] = value;
        }

        tokenIndex = keywordIndex;

        continue;
      }
    }

    const value = argumentTokens.slice(tokenIndex).join(" ").trim();

    if (value) {
      args[part.argument.name] = value;
      tokenIndex = argumentTokens.length;
    }

    if (!value && part.argument.required) {
      return {
        args,
        entities: selectedEntities,
        nextPart: part,
        complete: false,
      };
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
