"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT } from "@/components/i18n-provider";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

// Slightly longer than the dialog's exit animation (see ui/alert-dialog.tsx).
const EXIT_MS = 220;

const ConfirmContext = createContext<Confirm | null>(null);

// App-styled replacement for window.confirm():
//   const confirm = useConfirm();
//   if (await confirm({ title: "Obrisati?" })) { … }
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const t = useT();
  // `open` drives the animation; `options` outlives it so the dialog still has
  // its text while it fades out, instead of emptying mid-animation.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<(value: boolean) => void>(null);

  const confirm = useCallback<Confirm>((opts) => {
    setOptions(opts);
    setOpen(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  // Resolve only once the dialog has actually gone. Otherwise whatever the
  // caller does next — e.g. a tile fading out — plays behind the backdrop that
  // is still on screen, and looks like it never animated at all.
  function close(result: boolean) {
    const resolve = resolver.current;
    resolver.current = null;
    setOpen(false);
    setTimeout(() => {
      setOptions(null);
      resolve?.(result);
    }, EXIT_MS);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(next) => !next && close(false)}>
        <AlertDialogContent className="rounded-[1.75rem] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">{options?.title}</AlertDialogTitle>
            {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-[1.75rem] p-4">
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant={options?.destructive ? "destructive" : "default"}
              onClick={() => close(true)}
            >
              {options?.confirmLabel ?? t.common.ok}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}
