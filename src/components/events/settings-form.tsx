"use client";

import { useActionState, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormError, FormField } from "@/components/form-field";
import { EventTypePicker } from "@/components/events/event-type-picker";
import { BrandingUpload } from "@/components/events/branding-upload";
import { BackgroundPreview } from "@/components/events/background-preview";
import { BackgroundPreviewDialog } from "@/components/events/background-preview-dialog";
import { updateEvent, type SettingsState } from "@/app/dashboard/events/[id]/actions";
import { BRAND_COLORS, todayLocal, type EventType } from "@/lib/events";
import type { Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

export type SettingsFormEvent = {
  id: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  welcome_message: string | null;
  primary_color: string;
  uploads_open: boolean;
  deadline_local: string; // "YYYY-MM-DDTHH:mm" in Belgrade time, or ""
  has_pin: boolean;
  guests_can_view: boolean;
  logo_url: string | null;
  cover_url: string | null;
  plan: Plan;
  background_url: string | null;
};

export function SettingsForm({ event }: { event: SettingsFormEvent }) {
  const t = useT();
  const [state, formAction] = useActionState<SettingsState, FormData>(updateEvent.bind(null, event.id), undefined);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<EventType>(event.event_type);
  const [color, setColor] = useState(event.primary_color);
  const [pinEnabled, setPinEnabled] = useState(event.has_pin);
  const [dirty, setDirty] = useState(false);

  return (
    <form
      // Submit manually so React doesn't reset the fields after saving.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
        setDirty(false);
      }}
      onChange={() => setDirty(true)}
      className="flex flex-col gap-6"
    >
      <Section title={t.settings.sections.basics}>
        <EventTypePicker value={type} onChange={setType} />
        <FormField id="title" label={t.newEvent.eventTitle}>
          <Input id="title" name="title" required maxLength={120} defaultValue={event.title} />
        </FormField>
        <FormField id="event_date" label={t.newEvent.date}>
          <Input id="event_date" name="event_date" type="date" min={todayLocal()} defaultValue={event.event_date ?? ""} />
        </FormField>
        <FormField id="welcome_message" label={t.settings.welcome} hint={t.settings.welcomeHint}>
          <Textarea
            id="welcome_message"
            name="welcome_message"
            maxLength={1000}
            defaultValue={event.welcome_message ?? ""}
            placeholder={t.guest.defaultWelcome[type]}
          />
        </FormField>
      </Section>

      <Section title={t.settings.sections.look}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 pl-1 text-sm font-semibold">{t.settings.color}</legend>
          <div className="flex flex-wrap items-center gap-2">
            {BRAND_COLORS.map((c) => (
              <label
                key={c}
                className={cn(
                  "grid size-10 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-card transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring",
                  color === c && "ring-2 ring-ink",
                )}
                style={{ backgroundColor: c }}
              >
                <input type="radio" name="primary_color_preset" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" />
                {color === c && <Check className="size-5 text-white" aria-hidden />}
                <span className="sr-only">{c}</span>
              </label>
            ))}
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-input bg-card pr-3 pl-1 text-sm font-semibold">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
              {t.settings.customColor}
            </label>
          </div>
          <input type="hidden" name="primary_color" value={color} />
        </fieldset>

        <BrandingUpload eventId={event.id} kind="logo" initialUrl={event.logo_url} />
        <BrandingUpload eventId={event.id} kind="cover" initialUrl={event.cover_url} />

        {event.plan === "free" ? (
          <div className="flex flex-col gap-3">
            <BackgroundPreview />
            <p className="rounded-2xl bg-lilac-soft px-4 py-3 text-sm text-ink">{t.settings.backgroundLocked}</p>
            <BackgroundPreviewDialog />
          </div>
        ) : (
          <BrandingUpload eventId={event.id} kind="background" initialUrl={event.background_url} />
        )}
      </Section>

      <Section title={t.settings.sections.uploads}>
        <SwitchRow name="uploads_open" label={t.settings.uploadsOpen} hint={t.settings.uploadsOpenHint} defaultChecked={event.uploads_open} />
        <FormField id="upload_deadline" label={t.settings.deadline} hint={t.settings.deadlineHint}>
          <Input id="upload_deadline" name="upload_deadline" type="datetime-local" min={`${todayLocal()}T00:00`} defaultValue={event.deadline_local} />
        </FormField>
      </Section>

      <Section title={t.settings.sections.privacy}>
        <SwitchRow
          name="pin_enabled"
          label={t.settings.pinEnabled}
          hint={t.settings.pinHint}
          checked={pinEnabled}
          onCheckedChange={setPinEnabled}
        />
        {pinEnabled && (
          <FormField id="pin" label="PIN" hint={event.has_pin ? t.settings.pinSet : undefined}>
            <Input
              id="pin"
              name="pin"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d{4,8}"
              maxLength={8}
              placeholder={t.settings.pinPlaceholder}
              required={!event.has_pin}
              className="max-w-40 tracking-[0.3em]"
            />
          </FormField>
        )}
        <SwitchRow name="guests_can_view" label={t.settings.guestsCanView} hint={t.settings.guestsCanViewHint} defaultChecked={event.guests_can_view} />
      </Section>

      <FormError message={state?.error} />

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-full bg-card/90 p-2 pl-5 shadow-lg backdrop-blur">
        {state?.saved && !dirty && !pending && (
          <span className="mr-auto text-sm font-semibold text-primary">{t.settings.saved}</span>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {t.settings.save}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-[2rem] bg-card p-5 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function SwitchRow({
  name,
  label,
  hint,
  ...switchProps
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <Switch name={name} {...switchProps} className="mt-0.5" />
    </label>
  );
}
