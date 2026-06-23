import { routes, type AppRoute } from "../app/routes";

export function BottomNav({ activeRoute }: { activeRoute: AppRoute }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-3 pb-4 pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {routes.map((route) => (
          <a
            key={route.id}
            href={route.path}
            className={`rounded-lg px-2 py-2 text-center text-sm font-semibold ${
              activeRoute === route.id ? "bg-teal-50 text-teal-800" : "text-slate-600"
            }`}
          >
            {route.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
