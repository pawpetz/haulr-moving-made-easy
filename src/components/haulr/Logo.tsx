import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          inverted ? "bg-accent text-accent-foreground" : "bg-ink text-ink-foreground",
        )}
      >
        <Truck className="h-5 w-5" />
      </span>
      <span
        className={cn(
          "text-xl font-extrabold tracking-tight",
          inverted ? "text-ink-foreground" : "text-foreground",
        )}
      >
        Haulr
      </span>
    </Link>
  );
}
