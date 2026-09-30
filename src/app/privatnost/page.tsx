import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).legal.privacy.title };
}

export default async function PrivacyPage() {
  const t = await getT();
  return <LegalPage content={t.legal.privacy} />;
}
