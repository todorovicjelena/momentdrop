import { MarketingShell } from "@/components/marketing-shell";

type LegalContent = {
  title: string;
  updated: string;
  intro: string;
  sections: readonly { heading: string; body: string }[];
};

// Shared layout for Privacy and Terms — same shape, different copy.
export function LegalPage({ content }: { content: LegalContent }) {
  return (
    <MarketingShell>
      <div>
        <h1 className="font-serif text-4xl leading-[0.95] sm:text-6xl">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.updated}</p>
        <p className="mt-4 text-lg text-muted-foreground">{content.intro}</p>
      </div>

      <div className="flex flex-col gap-6">
        {content.sections.map((section) => (
          <section key={section.heading} className="rounded-[1.5rem] bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-serif text-xl">{section.heading}</h2>
            <p className="mt-2 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </MarketingShell>
  );
}
