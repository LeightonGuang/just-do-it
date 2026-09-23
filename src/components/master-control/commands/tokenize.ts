// tokenize.ts
export interface Token {
  text: string;
  start: number;
  end: number;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    tokens.push({
      text: m[1] ?? m[2],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return tokens;
}
