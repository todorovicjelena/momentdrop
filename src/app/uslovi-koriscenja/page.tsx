import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.legal.terms.title };

export default function TermsPage() {
  return <LegalPage content={t.legal.terms} />;
}
