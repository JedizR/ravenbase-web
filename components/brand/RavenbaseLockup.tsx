import { RavenbaseLogo, type LogoSize } from "./RavenbaseLogo"

// Text size paired to logo size per brand spec (00-brand-identity.md)
const TEXT_SIZE_MAP: Record<LogoSize, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
}

interface RavenbaseLockupProps {
  size?: LogoSize
  className?: string
}

export function RavenbaseLockup({ size = "md", className }: RavenbaseLockupProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <RavenbaseLogo size={size} />
      <span
        className={`font-sans font-extrabold tracking-wider uppercase text-foreground ${TEXT_SIZE_MAP[size]}`}
        style={{ lineHeight: 1 }}
      >
        RAVENBASE
      </span>
    </div>
  )
}
