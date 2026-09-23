import type { SubCommand, CommandPart, SelectedEntity } from "./types";

export type ParsedCommand = {
  args: Record<string, string>;
  entities: Record<string, SelectedEntity>;
  complete: boolean;
  nextPart: CommandPart | null;
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const parseCommand = (
  inputValue: string,
  selectedSubCommand?: SubCommand,
  selectedEntities: Record<string, SelectedEntity> = {},
): ParsedCommand => {
  if (!selectedSubCommand?.parts) {
    return {
      args: {},
      entities: selectedEntities,
      complete: false,
      nextPart: null,
    };
  }

  const trimmedInput = inputValue.trim();
  const tokens = trimmedInput.split(/\s+/).filter(Boolean);
  const parts = selectedSubCommand.parts;

  if (tokens.length < 2) {
    return {
      args: {},
      entities: selectedEntities,
      complete: false,
      nextPart: parts[0] ?? null,
    };
  }

  const rootAndSubLen = tokens[0].length + 1 + tokens[1].length;

  let remainingText = trimmedInput.slice(rootAndSubLen).trimStart();

  const args: Record<string, string> = {};

  let nextPart: CommandPart | null = null;
  let complete = true;

  const findNextKeyword = (text: string, startIndex: number) => {
    let earliest:
      | {
          index: number;
          partIndex: number;
        }
      | undefined;

    for (let i = startIndex; i < parts.length; i++) {
      const candidate = parts[i];

      if (candidate.type !== "keyword") {
        continue;
      }

      const regex = new RegExp(`\\b${escapeRegex(candidate.value)}\\b`, "i");

      const match = regex.exec(text);

      if (!match || match.index === undefined) {
        continue;
      }

      if (!earliest || match.index < earliest.index) {
        earliest = {
          index: match.index,
          partIndex: i,
        };
      }
    }

    return earliest;
  };

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];

    if (part.type === "keyword") {
      const currentText = remainingText.trimStart();

      const keywordRegex = new RegExp(
        `^${escapeRegex(part.value)}(?:\\s|$)`,
        "i",
      );

      if (keywordRegex.test(currentText)) {
        remainingText = currentText.slice(part.value.length).trimStart();

        continue;
      }

      if (part.optional) {
        continue;
      }

      nextPart = part;
      complete = false;
      break;
    }

    if (part.type !== "argument") {
      continue;
    }

    if (part.valueType === "entity" && part.entityType) {
      const currentText = remainingText.trimStart();

      const selectedEntity = selectedEntities[part.name];

      if (selectedEntity) {
        const label = selectedEntity.label;

        const entityRegex = new RegExp(`^${escapeRegex(label)}(?:\\s|$)`, "i");

        if (entityRegex.test(currentText)) {
          args[part.name] = label;

          remainingText = currentText.slice(label.length).trimStart();

          continue;
        }
      }

      if (!currentText) {
        if (part.required) {
          nextPart = part;
          complete = false;
          break;
        }

        continue;
      }

      const nextKeyword = findNextKeyword(currentText, idx + 1);

      if (nextKeyword) {
        const entityValue = currentText.slice(0, nextKeyword.index).trim();

        if (entityValue) {
          args[part.name] = entityValue;
        }

        remainingText = currentText.slice(nextKeyword.index).trimStart();

        idx = nextKeyword.partIndex - 1;

        continue;
      }

      const spaceIndex = currentText.indexOf(" ");

      if (spaceIndex === -1) {
        args[part.name] = currentText;

        nextPart = part;
        complete = false;
        break;
      }

      args[part.name] = currentText.slice(0, spaceIndex).trim();

      remainingText = currentText.slice(spaceIndex).trimStart();

      continue;
    }

    if (part.greedy) {
      const currentText = remainingText.trimStart();

      if (!currentText) {
        if (part.required) {
          nextPart = part;
          complete = false;
          break;
        }

        continue;
      }

      const nextKeyword = findNextKeyword(currentText, idx + 1);

      if (nextKeyword) {
        const value = currentText.slice(0, nextKeyword.index).trim();

        if (value) {
          args[part.name] = value;
        }

        remainingText = currentText.slice(nextKeyword.index).trimStart();

        idx = nextKeyword.partIndex - 1;

        continue;
      }

      args[part.name] = currentText;
      remainingText = "";

      continue;
    }

    if (part.valueType === "colour") {
      const currentText = remainingText.trimStart();

      const colorMatch = currentText.match(
        /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/,
      );

      if (colorMatch && colorMatch.index !== undefined) {
        args[part.name] = colorMatch[0];

        remainingText = currentText
          .slice(colorMatch.index + colorMatch[0].length)
          .trimStart();

        continue;
      }

      if (part.required) {
        nextPart = part;
        complete = false;
        break;
      }

      continue;
    }

    const currentText = remainingText.trimStart();

    if (!currentText) {
      if (part.required) {
        nextPart = part;
        complete = false;
        break;
      }

      continue;
    }

    const nextKeyword = findNextKeyword(currentText, idx + 1);

    if (nextKeyword) {
      const value = currentText.slice(0, nextKeyword.index).trim();

      if (value) {
        args[part.name] = value;
      }

      remainingText = currentText.slice(nextKeyword.index).trimStart();

      idx = nextKeyword.partIndex - 1;

      continue;
    }

    args[part.name] = currentText;
    remainingText = "";
  }

  if (complete) {
    for (const part of parts) {
      if (part.type !== "argument" || !part.required) {
        continue;
      }

      const value = args[part.name]?.trim() ?? "";

      if (!value) {
        complete = false;
        nextPart = part;
        break;
      }
    }
  }

  if (nextPart?.type === "argument" && nextPart.valueType === "entity") {
    complete = false;
  }

  return {
    args,
    entities: selectedEntities,
    complete,
    nextPart,
  };
};
