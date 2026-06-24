import { routes, type AppRoute } from "../app/routes";

function NavIcon({ id }: { id: AppRoute }) {
  const common = "h-5 w-5";

  if (id === "talk") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4.5a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0v-4a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6.5 11.2a5.5 5.5 0 0 0 11 0M12 16.7v2.8M9.2 19.5h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "breathe") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.2 13.2c2.6-1.9 4.5-1.9 7.1 0 1.4 1 2.9.9 4.4-.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M5.3 10.2c2.1-1.6 3.7-1.6 5.8 0M13.6 9.2c1.7-1.2 3-1.2 4.8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
        <path d="M8.2 17.1c2.1-1.2 3.6-1.2 5.7 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.48" />
      </svg>
    );
  }

  if (id === "move") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 5.4a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" fill="currentColor" />
        <path d="m8.7 11.1 2.3-3.5 3.6 1.3 2.4 2.4M11 7.6l-1.3 5.2 3.5 2.1M13.2 14.9l-1.1 4.4M9.8 12.8l-3 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "timeline") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4.5h10a2 2 0 0 1 2 2v12.2a1.2 1.2 0 0 1-1.7 1.1L12 17.5l-5.3 2.3A1.2 1.2 0 0 1 5 18.7V6.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8.5 8.5h7M8.5 11.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 20a6.8 6.8 0 0 1 13 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BottomNav({ activeRoute }: { activeRoute: AppRoute }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 px-3 pb-3">
      <div className="mx-auto grid max-w-[390px] grid-cols-5 gap-1 rounded-t-[22px] border border-[#e4d8c5] bg-[#fffaf0]/96 px-2 pb-2 pt-2 shadow-[0_-10px_28px_rgba(90,74,46,0.10)] backdrop-blur">
        {routes.map((route) => (
          <a
            key={route.id}
            href={route.path}
            aria-current={activeRoute === route.id ? "page" : undefined}
            className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-center text-[11px] font-semibold leading-none transition ${
              activeRoute === route.id
                ? "bg-[#446f4d] text-white shadow-[0_8px_16px_rgba(68,111,77,0.20)]"
                : "text-[#4f5a4d] active:bg-[#efe6d7]"
            }`}
          >
            <NavIcon id={route.id} />
            <span>{route.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
