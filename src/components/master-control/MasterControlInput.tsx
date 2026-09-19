import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type MasterControlInputProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  error: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

const MasterControlInput = forwardRef<
  HTMLInputElement,
  MasterControlInputProps
>(({ value, placeholder, disabled, error, onChange, onKeyDown }, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      value={value}
      autoComplete="off"
      spellCheck={false}
      disabled={disabled}
      aria-invalid={error}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={twMerge(
        "h-full min-w-0 flex-1 bg-transparent px-0 text-sm outline-none",
        "placeholder:text-muted-foreground/50",
        error && "text-danger",
      )}
    />
  );
});

MasterControlInput.displayName = "MasterControlInput";

export default MasterControlInput;
