type DateTimeFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const DateTimeField = ({
  id,
  label,
  value,
  onChange,
}: DateTimeFieldProps) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-text-muted"
      >
        {label}
      </label>

      <div className="flex gap-2">
        <input
          id={id}
          value={value}
          type="datetime-local"
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-text-muted"
        />

        <button
          type="button"
          disabled={!value}
          onClick={() => onChange("")}
          className="shrink-0 border border-danger-border px-3 text-xs text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:text-text disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
