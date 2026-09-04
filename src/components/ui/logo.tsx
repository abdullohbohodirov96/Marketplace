import Image from "next/image";
import Link from "next/link";

/**
 * Telefy brand mark: the "TF" icon (public/logo-icon.png, transparent
 * background so it works on both light and dark surfaces) plus the
 * wordmark rendered as text so its color can adapt per header.
 */
export function Logo({
  href = "/",
  className = "",
  textClassName = "text-primary",
  iconClassName = "h-7 w-auto sm:h-8",
  showText = true,
}: {
  href?: string;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={`flex shrink-0 items-center gap-2 ${className}`}>
      <Image
        src="/logo-icon.png"
        alt="Telefy"
        width={40}
        height={31}
        className={iconClassName}
        priority
      />
      {showText && (
        <span className={`text-lg font-bold tracking-tight sm:text-xl ${textClassName}`}>
          Telefy
        </span>
      )}
    </Link>
  );
}
