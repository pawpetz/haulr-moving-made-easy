import { JOB_FLOW, STATUS_LABELS } from "@/lib/constants";
import type { JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StatusTracker({ status }: { status: JobStatus }) {
  if (status === "CANCELLED" || status === "DISPUTED") {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        {STATUS_LABELS[status]}
      </div>
    );
  }
  const currentIndex = JOB_FLOW.indexOf(status);

  return (
    <ol className="space-y-0">
      {JOB_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-accent bg-accent text-accent-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {index < JOB_FLOW.length - 1 && (
                <span
                  className={cn("w-0.5 flex-1", done ? "bg-success" : "bg-border")}
                  style={{ minHeight: 18 }}
                />
              )}
            </div>
            <span
              className={cn(
                "pb-4 text-sm",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusPill({ status }: { status: JobStatus }) {
  const tone =
    status === "COMPLETED"
      ? "bg-success/15 text-success"
      : status === "CANCELLED" || status === "DISPUTED"
        ? "bg-destructive/10 text-destructive"
        : status === "REQUESTED" || status === "SEARCHING"
          ? "bg-accent/20 text-accent-foreground"
          : "bg-primary/10 text-primary";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
