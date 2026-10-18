import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
  children: ReactNode;
};

export function SubmitButton({
  pending = false,
  pendingLabel,
  children,
  disabled,
  className,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      className={className}
      disabled={disabled || pending}
      type={type}
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="loading loading-spinner loading-sm"
        />
      ) : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
