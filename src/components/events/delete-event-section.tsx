"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";
import { deleteEvent } from "@/app/dashboard/events/[id]/actions";
import { useT } from "@/components/i18n-provider";
import { toast } from "sonner";

// Separate from SettingsForm on purpose — this isn't a field that saves with
// the rest of the form, it's an irreversible action with its own confirm step.
export function DeleteEventSection({ eventId }: { eventId: string }) {
  const t = useT().settings.dangerZone;
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  async function handleDelete() {
    const ok = await confirm({
      title: t.confirmTitle,
      description: t.confirmDescription,
      confirmLabel: t.confirmButton,
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      // A successful delete redirect()s and never returns here.
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-[2rem] border-2 border-destructive/20 bg-card p-5 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl text-destructive">{t.title}</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-sm text-muted-foreground">{t.deleteHint}</p>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
          {pending ? t.deleting : t.deleteEvent}
        </Button>
      </div>
    </section>
  );
}
