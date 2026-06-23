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
    <main className="min-h-dvh bg-stone-100 text-slate-950">
      <div className="mx-auto min-h-dvh max-w-md bg-stone-50 px-4 pb-28 pt-5 shadow-[0_0_40px_rgba(15,23,42,0.08)]">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">nearu</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">{title}</h1>
          </div>
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-100 text-lg font-bold text-amber-950">
            ot
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
