"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Tutorial } from "@/lib/types";

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: color + "18", color }}
    >
      {text}
    </span>
  );
}
const diffColors: Record<string, string> = {
  beginner: "#27AE60",
  intermediate: "#E67E22",
  advanced: "#C0392B",
};
const catIcons: Record<string, string> = {
  interpretar_resultados: "📊",
  load_testing: "⚡",
  web_performance: "🌐",
  observability: "📈",
  capacity_planning: "📋",
  getting_started: "🚀",
};

function renderMd(md: string) {
  return md
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-base font-bold text-brand-dark mt-5 mb-2">$1</h3>',
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-lg font-bold text-brand-dark mt-6 mb-3">$1</h2>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`(.+?)`/g,
      '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-brand-accent">$1</code>',
    )
    .replace(
      /^- (.+)$/gm,
      '<li class="ml-4 text-sm text-gray-600 mb-1">• $1</li>',
    )
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match
        .split("|")
        .filter((c) => c.trim())
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      const tag = cells.every((c) => /^[-:]+$/.test(c)) ? "th" : "td";
      return `<tr>${cells.map((c) => `<${tag} class="px-3 py-1.5 border border-gray-200 text-sm">${c}</${tag}>`).join("")}</tr>`;
    })
    .replace(
      /(<tr>.*<\/tr>\n?)+/g,
      '<table class="w-full border-collapse mb-4 bg-white rounded-lg overflow-hidden">$&</table>',
    )
    .replace(
      /^(?!<[hltuo])(.*\S.*)$/gm,
      '<p class="text-sm text-gray-600 mb-2 leading-relaxed">$1</p>',
    );
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selected, setSelected] = useState<Tutorial | null>(null);
  const supabase = createClient();
  const t = useTranslations("tutorials");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tutorials")
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      if (data) setTutorials(data as Tutorial[]);
    }
    load();
  }, []);

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="text-brand-accent text-sm font-semibold mb-4 hover:underline"
        >
          {t("back")}
        </button>
        <div className="bg-white rounded-xl p-8 border border-gray-100 max-w-3xl">
          <div className="flex gap-2 mb-3">
            <Badge
              text={t(`difficulty.${selected.difficulty}`)}
              color={diffColors[selected.difficulty]}
            />
            <span className="text-xs text-gray-400">
              ⏱ {t("reading_time", { min: selected.reading_time_min ?? 0 })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-brand-dark mb-6">
            {selected.title}
          </h1>
          <div
            dangerouslySetInnerHTML={{ __html: renderMd(selected.content_md) }}
          />
          {selected.loom_url && (
            <a
              href={selected.loom_url}
              target="_blank"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent/90"
            >
              🎥 {t("watch_video")}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{t("title")}</h1>
      <p className="text-sm text-gray-500 mb-6">{t("subtitle")}</p>
      {tutorials.map((tut) => (
        <div
          key={tut.id}
          onClick={() => setSelected(tut)}
          className="bg-white rounded-xl px-5 py-4 border border-gray-100 mb-2.5 flex justify-between items-center cursor-pointer hover:shadow-sm transition"
        >
          <div>
            <div className="text-[14px] font-semibold text-brand-dark mb-1.5">
              {tut.title}
            </div>
            <div className="flex gap-2">
              <Badge
                text={t(`difficulty.${tut.difficulty}`)}
                color={diffColors[tut.difficulty]}
              />
              <span className="text-xs text-gray-400">
                ⏱ {t("reading_time_short", { min: tut.reading_time_min ?? 0 })}
              </span>
              <span className="text-xs text-gray-400">
                {catIcons[tut.category]}
              </span>
            </div>
          </div>
          <span className="text-xl text-brand-accent">→</span>
        </div>
      ))}
    </div>
  );
}
