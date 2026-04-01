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
  color?: string
  className?: string
}

export function RavenbaseLockup({ size = "lg", color = "currentColor", className }: RavenbaseLockupProps) {
  return (
    <div
      className={`flex items-center gap-2${className ? ` ${className}` : ""}`}
      style={{ color }}
    >
      <RavenbaseLogo size={size} color="currentColor" />
      <span
        className={`font-sans font-extrabold tracking-wider uppercase leading-none ${TEXT_SIZE_MAP[size]}`}
      >
        RAVENBASE
      </span>
    </div>
  )
}
