type OtterVariant = "default" | "listening" | "thinking" | "breathing";
type OtterSize = "hero" | "card" | "device" | "thumb";

const variantSrc: Record<OtterVariant, string> = {
  default: "/assets/otter-default-clean.png",
  listening: "/assets/otter-listening-clean.png",
  thinking: "/assets/otter-thinking-clean.png",
  breathing: "/assets/otter-breathing-clean.png"
};

const sizeClass: Record<OtterSize, string> = {
  hero: "h-[216px] w-[232px]",
  card: "h-24 w-24",
  device: "h-64 w-64",
  thumb: "h-16 w-16"
};

export function OtterIllustration({
  variant = "default",
  size = "hero",
  alt = "Otter companion",
  className = "",
  showHeart = false
}: {
  variant?: OtterVariant;
  size?: OtterSize;
  alt?: string;
  className?: string;
  showHeart?: boolean;
}) {
  return (
    <div className={`relative ${sizeClass[size]} ${className}`}>
      <img
        src={variantSrc[variant]}
        alt={alt}
        className="h-full w-full object-contain drop-shadow-[0_12px_28px_rgba(90,74,46,0.14)]"
      />
      {showHeart ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xl">🧡</div>
      ) : null}
    </div>
  );
}
