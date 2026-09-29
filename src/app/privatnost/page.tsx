import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.legal.privacy.title };

export default function PrivacyPage() {
  return <LegalPage content={t.legal.privacy} />;
}
