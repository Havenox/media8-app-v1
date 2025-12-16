// src/components/BrandLogo.tsx
import { Link } from "react-router-dom"
import { branding } from "@/data/branding"

type BrandLogoProps = {
  variant?: "cream" | "wine"
  size?: "sm" | "md" | "lg"
  href?: string
}

const sizes = {
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
}

export function BrandLogo({
  variant = "cream",
  size = "md",
  href = "/",
}: BrandLogoProps) {
  return (
    <Link to={href} className="inline-flex items-center">
      <img
        src={branding.logo[variant]}
        alt={branding.name}
        className={`${sizes[size]} w-auto object-contain`}
        loading="lazy"
      />
    </Link>
  )
}
