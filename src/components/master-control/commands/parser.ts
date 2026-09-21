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

  // Need root command and subcommand.
  if (tokens.length < 2) {
    return {
      args: {},
      entities: selectedEntities,
      complete: false,
      nextPart: parts[0] ?? null,
    };
  }

  // Remove root command and subcommand.
  const rootAndSubLen = tokens[0].length + 1 + tokens[1].length;

  let remainingText = trimmedInput.slice(rootAndSubLen).trimStart();

  const args: Record<string, string> = {};
  let nextPart: CommandPart | null = null;
  let complete = true;
  let idx = 0;

  while (idx < parts.length) {
    const part = parts[idx];

    // Handle keywords.
    if (part.type === "keyword") {
      const currentText = remainingText.trimStart();

      const keywordRegex = new RegExp(
        `^${escapeRegex(part.value)}(?:\\s|$)`,
        "i",
      );

      if (keywordRegex.test(currentText)) {
        remainingText = currentText.slice(part.value.length).trimStart();

        idx++;
        continue;
      }

      nextPart = part;
      complete = false;
      break;
    }

    // Handle arguments.
    if (part.type === "argument") {
      const nextPartInList = parts[idx + 1];

      // Handle an argument followed by a keyword.
      if (nextPartInList && nextPartInList.type === "keyword") {
        const keyword = nextPartInList.value;

        const keywordRegex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "gi");

        let lastMatch: RegExpExecArray | null = null;
        let match: RegExpExecArray | null;

        while ((match = keywordRegex.exec(remainingText)) !== null) {
          lastMatch = match;
        }

        if (lastMatch) {
          const argValue = remainingText.slice(0, lastMatch.index).trim();

          args[part.name] = argValue;

          remainingText = remainingText
            .slice(lastMatch.index + lastMatch[0].length)
            .trimStart();

          idx += 2;
          continue;
        }

        const argValue = remainingText.trim();

        // Argument is still missing.
        if (!argValue) {
          nextPart = part;
          complete = false;
          break;
        }

        // Argument exists, so keyword is next.
        args[part.name] = argValue;
        remainingText = "";
        nextPart = nextPartInList;
        complete = false;
        break;
      }

      // Handle color arguments.
      if (part.valueType === "color") {
        const colorMatch = remainingText.match(
          /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/,
        );

        if (colorMatch && colorMatch.index !== undefined) {
          const beforeColor = remainingText.slice(0, colorMatch.index).trim();

          const previousPart = parts[idx - 1];

          if (previousPart?.type === "argument" && !args[previousPart.name]) {
            args[previousPart.name] = beforeColor;
          }

          args[part.name] = colorMatch[0];
          remainingText = "";

          idx++;
          continue;
        }
      }

      // Handle greedy or final arguments.
      if (part.greedy || idx === parts.length - 1) {
        const argValue = remainingText.trim();

        if (argValue) {
          args[part.name] = argValue;
          remainingText = "";
          idx++;
          continue;
        }

        if (part.required) {
          nextPart = part;
          complete = false;
          break;
        }

        idx++;
        continue;
      }

      // Handle normal arguments.
      const spaceIndex = remainingText.indexOf(" ");

      if (spaceIndex !== -1) {
        args[part.name] = remainingText.slice(0, spaceIndex).trim();

        remainingText = remainingText.slice(spaceIndex).trimStart();
      } else {
        const argValue = remainingText.trim();

        if (argValue) {
          args[part.name] = argValue;
        }

        remainingText = "";
      }

      if (part.required && !args[part.name]) {
        nextPart = part;
        complete = false;
        break;
      }

      idx++;
    }
  }

  // Check required arguments.
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

  return {
    args,
    entities: selectedEntities,
    complete,
    nextPart,
  };
};
