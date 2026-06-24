import { useT } from "../locales";

interface Props {
  icon?: string;
  title: string;
  desc?: string;
  onClose: () => void;
}

export function DemoModal({ icon = "🦦", title, desc, onClose }: Props) {
  const t = useT();
  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="demo-modal-icon">{icon}</div>
        <p className="demo-modal-title">{title}</p>
        {desc && <p className="demo-modal-desc">{desc}</p>}
        <button className="demo-modal-close" onClick={onClose}>
          {t.common.close}
        </button>
      </div>
    </div>
  );
}
