import { twMerge } from "tailwind-merge";

import type { Theme } from "../../types/Theme";

interface TagProps {
  /** Name of the tag */
  name: string;
  /** Colour in hex */
  colour: string;
  /** Colour theme */
  theme: Theme;
  className?: string;
}

const Tag = ({ name, colour, theme, className }: TagProps) => {
  const isDark = theme === "dark";

  return (
    <div
      className={twMerge(
        "inline-flex w-max items-center justify-center rounded-full px-1 py-0.5 text-xs leading-none hover:brightness-95",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${colour} ${
          isDark ? "25%" : "15%"
        }, transparent)`,
        color: `color-mix(in srgb, ${colour} ${
          isDark ? "100%" : "70%"
        }, ${isDark ? "white" : "black"})`,
        border: `1px solid color-mix(in srgb, ${colour} ${
          isDark ? "45%" : "20%"
        }, transparent)`,
      }}
    >
      {name}
    </div>
  );
};

export default Tag;
