import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type ButtonTone = "primary" | "secondary" | "quiet";

export function Button({
  tone = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  const tones: Record<ButtonTone, string> = {
    primary: "bg-teal-700 text-white shadow-sm active:bg-teal-800",
    secondary: "bg-white text-slate-900 border border-stone-200 shadow-sm active:bg-stone-50",
    quiet: "bg-transparent text-slate-700 active:bg-slate-100"
  };

  return (
    <button
      className={`min-h-12 rounded-lg px-5 text-base font-semibold transition disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function Panel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`rounded-lg border border-stone-200 bg-white p-4 shadow-sm ${className}`} {...props} />;
}

export function Modal({
  title,
  children,
  footer,
  onClose
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-end bg-slate-950/35 px-3 pb-3 sm:place-items-center">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="modal-title" className="text-xl font-bold text-slate-950">
            {title}
          </h2>
          <button
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-xl text-slate-500 active:bg-slate-100"
            type="button"
            onClick={onClose}
          >
            x
          </button>
        </div>
        <div className="mt-3">{children}</div>
        {footer && <div className="mt-4 grid gap-2">{footer}</div>}
      </section>
    </div>
  );
}

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#efe7da] text-slate-950">
      <div className="mx-auto min-h-dvh w-full max-w-[390px] bg-[#f7f1e6] px-4 pb-28 pt-5 shadow-[0_0_40px_rgba(90,74,46,0.08)]">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7f7668]">Otter companion</p>
            <h1 className="mt-1 text-[1.85rem] font-semibold leading-tight text-[#20362b]">{title}</h1>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80 text-lg shadow-[0_6px_16px_rgba(90,74,46,0.08)]">
            <img src="/assets/otter-default-clean.png" alt="" className="h-9 w-9 object-contain" />
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
