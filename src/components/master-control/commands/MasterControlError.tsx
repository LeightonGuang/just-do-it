const MasterControlError = ({ error }: { error: string }) => {
  return (
    <div
      role="alert"
      className="absolute right-0 bottom-full z-50 mb-2 flex w-max items-start gap-2 border border-danger-border bg-danger-background px-3 py-2 text-xs text-danger shadow-lg"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 1 1.06 0L10 7.94l.72-.72a.75.75 0 1 1 1.06 1.06l-.72.72a.75.75 0 1 1 1.06 1.06l-.72.72a.75.75 0 1 1-1.06 1.06l-.72-.72a.75.75 0 1 1-1.06-1.06l-.72-.72a.75.75 0 0 1 0-1.06Z"
        />
      </svg>

      <span className="min-w-0 flex-1 leading-5">{error}</span>
    </div>
  );
};

export default MasterControlError;
