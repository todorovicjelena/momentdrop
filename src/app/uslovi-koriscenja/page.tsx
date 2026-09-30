import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).legal.terms.title };
}

export default async function TermsPage() {
  const t = await getT();
  return <LegalPage content={t.legal.terms} />;
}
