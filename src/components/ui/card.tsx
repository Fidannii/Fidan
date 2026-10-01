import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_1px_0_rgba(11,31,26,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
