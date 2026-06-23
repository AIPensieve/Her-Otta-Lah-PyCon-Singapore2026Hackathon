import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

type ButtonTone = "primary" | "secondary" | "quiet";

export function Button({
  tone = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  const tones: Record<ButtonTone, string> = {
    primary: "bg-teal-700 text-white shadow-sm active:bg-teal-800",
    secondary: "bg-white text-slate-900 border border-slate-200 shadow-sm active:bg-slate-50",
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
  return <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`} {...props} />;
}

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-stone-50 px-4 pb-24 pt-5 text-slate-950">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </main>
  );
}
