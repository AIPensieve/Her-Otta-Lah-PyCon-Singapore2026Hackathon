import { Panel } from "@ai-otter/ui";

export function LoadingSpinner({ message = "AI 正在思考中..." }: { message?: string }) {
  return (
    <Panel className="flex min-h-32 flex-col items-center justify-center space-y-4 p-6 shadow-sm border-slate-100">
      <div className="relative grid size-12 place-items-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-teal-200 opacity-75"></div>
        <div className="relative size-8 rounded-full bg-teal-500"></div>
      </div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
    </Panel>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 rounded-full bg-slate-200 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
}
