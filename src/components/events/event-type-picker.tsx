"use client";

import { Cake, Church, Gem, PartyPopper } from "lucide-react";
import { EVENT_TYPES, type EventType } from "@/lib/events";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

const TYPE_ICONS: Record<EventType, typeof Gem> = {
  wedding: Gem,
  christening: Church,
  birthday: Cake,
  other: PartyPopper,
};

// Four big radio "cards" (submitted as `event_type`).
export function EventTypePicker({ value, onChange }: { value: EventType; onChange: (value: EventType) => void }) {
  const t = useT();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 pl-1 text-sm font-semibold">{t.newEvent.type}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EVENT_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type];
          const active = value === type;
          return (
            <label
              key={type}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition-colors",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-lilac",
              )}
            >
              <input
                type="radio"
                name="event_type"
                value={type}
                checked={active}
                onChange={() => onChange(type)}
                className="sr-only"
              />
              <Icon className="size-6" aria-hidden />
              {t.eventTypeLabels[type]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
