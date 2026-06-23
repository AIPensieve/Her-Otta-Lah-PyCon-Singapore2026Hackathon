import { useEffect, useState } from "react";
import type { RecordCard } from "@ai-otter/shared-types";
import { PageShell, Panel } from "@ai-otter/ui";
import { readRecords } from "../store/localRecords";

export function TimelinePage() {
  const [records, setRecords] = useState<RecordCard[]>([]);

  useEffect(() => {
    setRecords(readRecords());
  }, []);

  return (
    <PageShell title="记录">
      {records.length === 0 ? (
        <Panel>
          <p className="text-lg font-semibold">还没有记录。</p>
          <p className="mt-2 text-slate-600">从说说页开始，完成一个小行动后可以保存到这里。</p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Panel key={record.id}>
              <p className="text-lg font-bold">{record.title}</p>
              <p className="mt-2 text-slate-700">{record.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {record.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">{new Date(record.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-500">{record.safetyDisclaimer}</p>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
