"use client";
import { useTranslations } from "next-intl";

export default function AdminOverviewPage() {
  const t = useTranslations("admin");
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">{t("overview.title")}</h1>
      <p className="text-gray-500">Loading overview...</p>
    </div>
  );
}
