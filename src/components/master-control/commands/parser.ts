// parser.ts
import { tokenize, type Token } from "./tokenize";
import type { SubCommand, CommandPart, SelectedEntity } from "./types";

type KeywordPart = Extract<CommandPart, { type: "keyword" }>;
type ArgumentPart = Extract<CommandPart, { type: "argument" }>;

export type ParsedCommand = {
  args: Record<string, string>;
  entities: Record<string, SelectedEntity>;
  complete: boolean;
  activePart: CommandPart | null;
  activeToken: Token | null;
  availableKeywords: KeywordPart[]; // populated when >1 keyword could come next
};

const caretIn = (caret: number, tok?: Token) =>
  !!tok && caret >= tok.start && caret <= tok.end;

function getFlexPairs(flexParts: CommandPart[]) {
  const pairs: { keyword: KeywordPart; argument: ArgumentPart }[] = [];
  for (let i = 0; i < flexParts.length; i++) {
    const p = flexParts[i];
    const next = flexParts[i + 1];
    if (p.type === "keyword" && next?.type === "argument") {
      pairs.push({ keyword: p, argument: next });
    }
  }
  return pairs;
}

export function parseCommand(
  input: string,
  caret: number,
  subCommand: SubCommand | undefined,
  selectedEntities: Record<string, SelectedEntity> = {},
): ParsedCommand {
  const empty: ParsedCommand = {
    args: {},
    entities: selectedEntities,
    complete: false,
    activePart: null,
    activeToken: null,
    availableKeywords: [],
  };

  if (!subCommand?.parts?.length) return empty;

  const tokens = tokenize(input);
  const parts = subCommand.parts;

  // everything from the first *optional* keyword onward is unordered
  const splitIdx = parts.findIndex((p) => p.type === "keyword" && p.optional);
  const leadingParts = splitIdx === -1 ? parts : parts.slice(0, splitIdx);
  const flexParts = splitIdx === -1 ? [] : parts.slice(splitIdx);

  let ti = Math.min(2, tokens.length); // skip "/edit" + "project"
  const args: Record<string, string> = {};
  let activePart: CommandPart | null = null;
  let activeToken: Token | null = null;
  let complete = true;

  // ---------- Phase 1: leading, strictly ordered ----------
  for (let pi = 0; pi < leadingParts.length; pi++) {
    const part = leadingParts[pi];
    const tok = tokens[ti];

    if (part.type === "keyword") {
      if (tok && tok.text.toLowerCase() === part.value.toLowerCase()) {
        ti++;
        continue;
      }
      if (!activePart) {
        activePart = part;
        activeToken = tok ?? null;
      }
      complete = false;
      break;
    }

    // argument
    const entity = selectedEntities[part.name];
    if (part.valueType === "entity" && entity?.label) {
      const label = entity.label.trim();
      const labelTokens = label.split(/\s+/).filter(Boolean);
      const slice = tokens.slice(ti, ti + labelTokens.length);
      const covered = slice.map((t) => t.text).join(" ");

      if (covered.toLowerCase() === label.toLowerCase()) {
        args[part.name] = label;
        const hit = slice.find((t) => caretIn(caret, t));
        if (hit) {
          activePart = part;
          activeToken = hit;
        }
        ti += labelTokens.length;
        continue;
      }
    }

    if (!tok) {
      if (!activePart) {
        activePart = part;
        activeToken = null;
      }
      if (part.required) complete = false;
      break;
    }

    if (part.greedy) {
      const nextKw = leadingParts
        .slice(pi + 1)
        .find((p): p is KeywordPart => p.type === "keyword");
      const stopAt = nextKw
        ? tokens.findIndex(
            (t, i) =>
              i >= ti && t.text.toLowerCase() === nextKw.value.toLowerCase(),
          )
        : -1;
      const endTi = stopAt === -1 ? tokens.length : stopAt;
      const slice = tokens.slice(ti, endTi);

      args[part.name] = slice.map((t) => t.text).join(" ");
      const hit = slice.find((t) => caretIn(caret, t));
      if (hit) {
        activePart = part;
        activeToken = hit;
      }
      ti = endTi;
      if (!args[part.name] && part.required) complete = false;
      continue;
    }

    args[part.name] = tok.text;
    if (caretIn(caret, tok)) {
      activePart = part;
      activeToken = tok;
    }
    ti++;
  }

  // required leading part unresolved — stop here, don't enter flex phase
  if (activePart || !complete) {
    return {
      args,
      entities: selectedEntities,
      complete,
      activePart,
      activeToken,
      availableKeywords: [],
    };
  }

  // ---------- Phase 2: flex — unordered keyword/argument pairs ----------
  const pairs = getFlexPairs(flexParts);
  const usedKeywords = new Set<string>();

  type Occ = { pair: (typeof pairs)[number]; tokenIndex: number };
  const occurrences: Occ[] = [];

  for (let idx = ti; idx < tokens.length; idx++) {
    const t = tokens[idx];
    const pair = pairs.find(
      (p) =>
        !usedKeywords.has(p.keyword.value) &&
        p.keyword.value.toLowerCase() === t.text.toLowerCase(),
    );
    if (pair) {
      occurrences.push({ pair, tokenIndex: idx });
      usedKeywords.add(pair.keyword.value);
    }
  }
  occurrences.sort((a, b) => a.tokenIndex - b.tokenIndex);

  let availableKeywords: KeywordPart[] = [];

  const firstOccIdx = occurrences[0]?.tokenIndex ?? tokens.length;
  const leadingFlexTokens = tokens.slice(ti, firstOccIdx);
  const hit = leadingFlexTokens.find((t) => caretIn(caret, t));
  const caretAtGapEnd =
    ti >= tokens.length && caret >= (tokens[ti - 1]?.end ?? 0);

  if (hit || (leadingFlexTokens.length === 0 && caretAtGapEnd)) {
    const query = (hit?.text ?? "").toLowerCase();
    availableKeywords = pairs
      .filter((p) => !usedKeywords.has(p.keyword.value))
      .map((p) => p.keyword)
      .filter((k) => k.value.toLowerCase().startsWith(query));
    activeToken = hit ?? null;
  } else if (leadingFlexTokens.length > 0) {
    complete = false; // text that doesn't match any known keyword
  }

  for (let oi = 0; oi < occurrences.length; oi++) {
    const { pair, tokenIndex } = occurrences[oi];
    const segStart = tokenIndex + 1;
    const segEnd = occurrences[oi + 1]?.tokenIndex ?? tokens.length;
    const slice = tokens.slice(segStart, segEnd);
    const value = slice.map((t) => t.text).join(" ");

    if (value) args[pair.argument.name] = value;

    const segHit = slice.find((t) => caretIn(caret, t));
    const gapCaret =
      slice.length === 0 &&
      caret >= (tokens[tokenIndex]?.end ?? 0) &&
      caret <= (tokens[segEnd]?.start ?? input.length);

    if (segHit || gapCaret) {
      activePart = pair.argument;
      activeToken = segHit ?? null;
    }

    if (pair.argument.required && !args[pair.argument.name]?.trim()) {
      complete = false;
    }
  }

  return {
    args,
    entities: selectedEntities,
    complete,
    activePart,
    activeToken,
    availableKeywords,
  };
}
