import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "lg";
}) {
  const dimension = size === "lg" ? "h-9 w-9" : "h-4 w-4";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange?.(star)}
          className={cn(onChange ? "cursor-pointer" : "cursor-default")}
        >
          <Star
            className={cn(
              dimension,
              star <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
