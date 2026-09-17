import { twMerge } from "tailwind-merge";
import { useLayoutEffect, useRef, useState } from "react";

type AutoSizeInputProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  error: boolean;
  type: "text" | "color" | "number";
  fullWidth?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

const AutoSizeInput = ({
  value,
  placeholder,
  disabled,
  error,
  type,
  fullWidth = false,
  inputRef,
  onChange,
  onKeyDown,
}: AutoSizeInputProps) => {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(8);

  useLayoutEffect(() => {
    if (type === "color") {
      return;
    }

    if (!measureRef.current) {
      return;
    }

    const measuredWidth = measureRef.current.getBoundingClientRect().width;

    /*
     * Add a small amount of extra space so the final character
     * is never clipped by the input itself.
     */
    setWidth(Math.ceil(measuredWidth) + 2);
  }, [value, placeholder, type]);

  if (type === "color") {
    const color = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

    const handleColorChange = (nextValue: string) => {
      const withoutHash = nextValue.replace(/^#/, "");

      const hex = withoutHash.replace(/[^0-9a-fA-F]/g, "");

      const limited = hex.slice(0, 6);

      onChange(`#${limited}`);
    };

    return (
      <div className="flex h-full shrink-0 items-center">
        <input
          type="text"
          ref={inputRef}
          disabled={disabled}
          value={value || "#"}
          aria-invalid={error}
          onKeyDown={onKeyDown}
          placeholder="#000000"
          onChange={(event) => handleColorChange(event.target.value)}
          className={twMerge(
            "h-full w-20 bg-transparent px-1 text-sm outline-none",
            "placeholder:text-muted-foreground/50",
            error && "text-danger",
          )}
        />

        <input
          type="color"
          value={color}
          disabled={disabled}
          aria-label="Choose color"
          onChange={(event) => onChange(event.target.value)}
          className={twMerge(
            "h-6 w-6 shrink-0 cursor-pointer border-0 bg-transparent p-0",
            error && "opacity-70",
          )}
        />
      </div>
    );
  }

  return (
    <>
      {/*
       * Hidden measurement element.
       *
       * `whitespace-pre` is important here.
       *
       * Without it, HTML collapses spaces and the measured
       * width can be smaller than the actual input content.
       */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className={twMerge(
          "pointer-events-none absolute left-[-9999px]",
          "px-0 text-sm whitespace-pre",
          "font-normal",
        )}
      >
        {value || placeholder}
      </span>

      <input
        type={type}
        value={value}
        ref={inputRef}
        disabled={disabled}
        aria-invalid={error}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={
          fullWidth
            ? undefined
            : {
                width: `${width}px`,
              }
        }
        className={twMerge(
          "h-full shrink-0 bg-transparent p-0 text-sm outline-none",
          "placeholder:text-muted-foreground/50",
          fullWidth && "min-w-0 flex-1",
          error && "text-danger",
        )}
      />
    </>
  );
};

export default AutoSizeInput;
