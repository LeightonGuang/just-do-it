import { twMerge } from "tailwind-merge";

interface TagProps {
  /* name of the tag */
  name: string;
  /* colour in hex */
  colour: string;
  className?: string;
}

const Tag = ({ name, colour, className }: TagProps) => {
  return (
    <div
      className={twMerge(
        "inline-flex w-max items-center justify-center rounded-full px-1 py-0.5 text-xs leading-none hover:brightness-95",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${colour} 15%, transparent)`,
        color: `color-mix(in srgb, ${colour} 70%, black)`,
        border: `1px solid ${colour}20`,
      }}
    >
      {name}
    </div>
  );
};

export default Tag;
