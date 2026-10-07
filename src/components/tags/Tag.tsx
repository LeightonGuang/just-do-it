interface TagProps {
  /* name of the tag */
  name: string;
  /* colour in hex */
  colour: string;
}

const Tag = ({ name, colour }: TagProps) => {
  return (
    <div
      className="flex w-max items-center gap-2 rounded-full px-1 py-px text-xs hover:brightness-95"
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
