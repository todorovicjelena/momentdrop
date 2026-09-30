"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, FormField } from "@/components/form-field";
import { EventTypePicker } from "@/components/events/event-type-picker";
import { createEvent, type CreateEventState } from "@/app/dashboard/actions";
import { useSlugFromTitle } from "@/hooks/use-slug-from-title";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { todayLocal, type EventType } from "@/lib/events";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

// linkPrefix: what guests' links start with, e.g. "momentdrop.rs/event/"
export function EventForm({ linkPrefix }: { linkPrefix: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(createEvent, undefined);
  const [type, setType] = useState<EventType>("wedding");
  const [date, setDate] = useState("");
  const { title, setTitle, slug, setSlug } = useSlugFromTitle();
  const availability = useSlugAvailability(slug);
  // Server-side check on submit can also suggest a free link (race with another host).
  const suggestion =
    availability.status === "taken" ? availability.suggestion : state?.field === "slug" ? state.suggestion : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <EventTypePicker value={type} onChange={setType} />

      <FormField id="title" label={t.newEvent.eventTitle}>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.newEvent.eventTitlePlaceholder[type]}
          aria-invalid={state?.field === "title" || undefined}
        />
      </FormField>

      <FormField id="event_date" label={t.newEvent.date}>
        <Input id="event_date" name="event_date" type="date" min={todayLocal()} value={date} onChange={(e) => setDate(e.target.value)} />
      </FormField>

      <FormField id="slug" label={t.newEvent.slug}>
        <div
          className={cn(
            "flex h-12 items-center overflow-hidden rounded-2xl border-2 border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            (availability.status === "taken" || state?.field === "slug") && "border-destructive",
            availability.status === "free" && "border-[#3f8f6a]",
          )}
        >
          <span className="shrink-0 pl-4 text-sm text-muted-foreground">{linkPrefix}</span>
          <input
            id="slug"
            name="slug"
            required
            minLength={3}
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent pr-4 text-base font-semibold outline-none md:text-sm"
          />
        </div>
        <SlugStatus status={availability.status} suggestion={suggestion} onUse={setSlug} />
      </FormField>

      <FormError message={state?.error} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          {t.newEvent.cancel}
        </Link>
        <Button type="submit" size="lg" disabled={pending}>
          {t.newEvent.submit}
        </Button>
      </div>
    </form>
  );
}

function SlugStatus({
  status,
  suggestion,
  onUse,
}: {
  status: "idle" | "checking" | "free" | "taken" | "invalid";
  suggestion?: string;
  onUse: (slug: string) => void;
}) {
  const t = useT();
  if (suggestion) {
    return (
      <button
        type="button"
        onClick={() => onUse(suggestion)}
        className="self-start pl-1 text-left text-xs font-semibold text-destructive underline underline-offset-2"
      >
        {t.newEvent.slugTakenUse(suggestion)}
      </button>
    );
  }
  if (status === "checking") {
    return (
      <p className="inline-flex items-center gap-1 pl-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        {t.newEvent.slugChecking}
      </p>
    );
  }
  if (status === "free") {
    return (
      <p className="inline-flex items-center gap-1 pl-1 text-xs font-semibold text-[#3f8f6a]">
        <Check className="size-3" aria-hidden />
        {t.newEvent.slugFree}
      </p>
    );
  }
  return <p className="pl-1 text-xs text-muted-foreground">{t.newEvent.slugHint}</p>;
}
