import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[var(--surface-2)] text-[var(--ink-muted)]",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-900",
    info: "bg-sky-100 text-sky-900",
    danger: "bg-red-100 text-red-900",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(
  status: string,
): "neutral" | "success" | "warning" | "info" | "danger" {
  switch (status) {
    case "qualified":
    case "won":
      return "success";
    case "new":
      return "info";
    case "contacted":
    case "appointment":
      return "warning";
    case "lost":
    case "spam":
      return "danger";
    default:
      return "neutral";
  }
}
