"use client";

import { Check, FileX, Loader2, RotateCw, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";
import type { UploadItem } from "@/hooks/use-guest-uploads";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

// One file in the guest's upload list: preview, status/progress, retry or delete.
export function UploadRow({ item, onRetry, onDelete }: { item: UploadItem; onRetry: () => void; onDelete: () => void }) {
  const t = useT();
  const g = t.guest;
  const confirm = useConfirm();
  const label =
    item.status === "uploading" ? `${g.status.uploading} ${item.progress}%` : item.error ?? g.status[item.status];

  return (
    <li className="flex animate-in items-center gap-3 rounded-2xl bg-card p-2 pr-3 shadow-sm duration-300 fade-in slide-in-from-bottom-2">
      <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-lilac-soft">
        {item.previewUrl ? (
          // Local object URL preview (not a remote image).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt="" className="size-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
        ) : item.kind === "video" ? (
          <Video className="size-5 text-muted-foreground" aria-hidden />
        ) : (
          <FileX className="size-5 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className={cn("text-xs", item.status === "error" ? "text-destructive" : "text-muted-foreground")}>{label}</p>
        {(item.status === "uploading" || item.status === "preparing") && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${item.status === "preparing" ? 5 : item.progress}%` }}
            />
          </div>
        )}
      </div>
      {item.status === "done" && (
        <>
          <Check className="size-5 shrink-0 animate-in text-primary duration-300 zoom-in-50" aria-label={g.status.done} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={g.deleteMine}
            onClick={async () => {
              const ok = await confirm({
                title: g.confirmDeleteMine,
                description: g.confirmDeleteMineHint,
                confirmLabel: t.common.delete,
                destructive: true,
              });
              if (ok) onDelete();
            }}
          >
            <Trash2 aria-hidden />
          </Button>
        </>
      )}
      {(item.status === "preparing" || item.status === "waiting") && (
        <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      )}
      {item.status === "error" && item.retryable !== false && (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRetry} aria-label={g.retry}>
          <RotateCw aria-hidden />
        </Button>
      )}
    </li>
  );
}
