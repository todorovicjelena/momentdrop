"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: readonly { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="rounded-[1.5rem] bg-lilac-soft p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-semibold"
            >
              {item.q}
              <ChevronDown
                className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")}
                aria-hidden
              />
            </button>
            {/* grid-template-rows 0fr↔1fr animates height smoothly without
                measuring content, and clips cleanly via overflow-hidden. */}
            <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
              <p className="overflow-hidden text-muted-foreground">
                <span className="block pt-3">{item.a}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
