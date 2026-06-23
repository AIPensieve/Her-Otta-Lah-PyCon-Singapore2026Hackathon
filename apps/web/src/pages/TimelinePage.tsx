import { useEffect, useState } from "react";
import type { RecordCard } from "@ai-otter/shared-types";
import { PageShell, Panel } from "@ai-otter/ui";
import { recordRepository } from "../store/localRecords";
import { RecordCardUI } from "../components/RecordCardUI";

export function TimelinePage() {
  const [records, setRecords] = useState<RecordCard[]>([]);

  useEffect(() => {
    recordRepository.list().then(setRecords);
  }, []);

  return (
    <PageShell title="记录">
      {records.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center p-8 text-center bg-stone-50 border-dashed border-2 border-slate-300">
          <div className="mb-4 grid size-20 place-items-center rounded-full bg-slate-200 text-4xl">o</div>
          <p className="text-xl font-bold text-slate-800">还没有记录</p>
          <p className="mt-2 text-base text-slate-600">从首页开始，完成一个小行动后，<br />可以把你的状态保存到这里。</p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <RecordCardUI key={record.id} record={record} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
