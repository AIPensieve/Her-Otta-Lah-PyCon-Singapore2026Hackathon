import type { RecordCard } from "@ai-otter/shared-types";
import { Panel } from "@ai-otter/ui";

export function RecordCardUI({ record }: { record: RecordCard }) {
  const dateStr = new Date(record.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <Panel className="border-slate-200 p-5 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-xl font-bold text-slate-900">{record.title}</p>
        <span className="shrink-0 text-sm font-medium text-slate-500">{dateStr}</span>
      </div>
      <p className="mt-1 text-base leading-relaxed text-slate-700">{record.summary}</p>
      
      {record.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {record.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 border border-teal-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {record.safetyDisclaimer && (
        <p className="mt-4 text-xs italic text-slate-400">{record.safetyDisclaimer}</p>
      )}
    </Panel>
  );
}
