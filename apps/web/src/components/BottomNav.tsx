import { routes, type AppRoute } from "../app/routes";

export function BottomNav({ activeRoute }: { activeRoute: AppRoute }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 px-3 pb-4 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {routes.map((route) => (
          <a
            key={route.id}
            href={route.path}
            className={`flex min-h-14 items-center justify-center rounded-lg px-1 text-center text-sm font-semibold leading-tight transition ${
              activeRoute === route.id
                ? "bg-teal-50 text-teal-800 shadow-[inset_0_0_0_1px_rgba(15,118,110,0.16)]"
                : "text-slate-600 active:bg-stone-100"
            }`}
          >
            {route.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
