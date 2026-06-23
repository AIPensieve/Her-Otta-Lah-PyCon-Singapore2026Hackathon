import type { ActionCompletionResponse } from "@ai-otter/shared-types";
import { Button, Modal } from "@ai-otter/ui";

export function SaveRecordPrompt({
  completion,
  saved,
  onDismiss,
  onSave
}: {
  completion: ActionCompletionResponse;
  saved: boolean;
  onDismiss: () => void;
  onSave: () => void;
}) {
  const record = completion.proposedRecord;

  return (
    <Modal title="要记录下来吗？" onClose={onDismiss}>
      <p className="text-lg text-slate-700">{completion.reflectionPrompt}</p>
      <div className="mt-4 rounded-lg bg-stone-50 p-4">
        <p className="text-lg font-bold text-slate-950">{record.title}</p>
        <p className="mt-2 text-base text-slate-700">{record.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {record.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{record.safetyDisclaimer}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button disabled={saved} onClick={onSave}>
          {saved ? "已保存" : "保存"}
        </Button>
        <Button tone="secondary" onClick={onDismiss}>
          先不保存
        </Button>
      </div>
      {saved && (
        <Button className="mt-2 w-full" tone="quiet" onClick={() => (window.location.hash = "/timeline")}>
          查看记录
        </Button>
      )}
    </Modal>
  );
}
