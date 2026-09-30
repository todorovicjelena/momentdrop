"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, FormField } from "@/components/form-field";
import { checkGuestAccess } from "@/app/event/[slug]/actions";
import { GUEST_NAME_MAX } from "@/lib/uploads";
import { useT } from "@/components/i18n-provider";

// Guest's name (and the event PIN, if set) before they can upload.
export function IdentityForm({
  slug,
  hasPin,
  initialName,
  onDone,
}: {
  slug: string;
  hasPin: boolean;
  initialName: string;
  onDone: (name: string, pin: string) => void;
}) {
  const g = useT().guest;
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const pin = String(data.get("pin") ?? "").trim();
        if (!name) return setError(g.errors.nameRequired);
        setError(undefined);
        startTransition(async () => {
          if (hasPin) {
            const access = await checkGuestAccess(slug, pin);
            if (!access.ok) return setError(access.error);
          }
          onDone(name, pin);
        });
      }}
    >
      <FormField id="guest-name" label={g.yourName} hint={g.yourNameHint}>
        <Input
          id="guest-name"
          name="name"
          autoComplete="name"
          required
          maxLength={GUEST_NAME_MAX}
          defaultValue={initialName}
          placeholder={g.yourNamePlaceholder}
        />
      </FormField>
      {hasPin && (
        <FormField id="guest-pin" label={g.pin} hint={g.pinHint}>
          <Input
            id="guest-pin"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            required
            maxLength={8}
            className="tracking-[0.3em]"
          />
        </FormField>
      )}
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {g.continue}
      </Button>
    </form>
  );
}
