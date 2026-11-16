import { ExternalLink, Facebook, Globe, Instagram, Linkedin, Youtube } from "lucide-react";
import { institutionalLinks } from "@/config/institutional";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

const items = [
  { key: "site", label: "Site MetaRH", href: institutionalLinks.site, icon: Globe },
  { key: "instagram", label: "Instagram", href: institutionalLinks.instagram, icon: Instagram },
  { key: "linkedin", label: "LinkedIn", href: institutionalLinks.linkedin, icon: Linkedin },
  { key: "youtube", label: "YouTube", href: institutionalLinks.youtube, icon: Youtube },
  { key: "facebook", label: "Facebook", href: institutionalLinks.facebook, icon: Facebook },
] as const;

type Props = {
  className?: string;
  compact?: boolean;
  title?: string;
  showFacebook?: boolean;
};

export function InstitutionalLinks({
  className,
  compact = false,
  title = "CANAIS METARH",
  showFacebook = true,
}: Props) {
  const links = showFacebook ? items : items.filter((item) => item.key !== "facebook");

  return (
    <section
      className={cn(
        `rounded-2xl border border-border/70 bg-surface-elevated/60 p-4 flex justify-center  ${!compact ? "flex-col" : "flex-row"} gap-4`,
        compact && "p-3",
        className,
      )}
      aria-label={title}
    >
      {!compact ? (
        <div className="mb-3 flex items-center gap-2">
          <Icon icon={ExternalLink} className="size-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
      ) : null}
      <ul className={cn("flex flex-wrap justify-between gap-2", compact ? "gap-1.5" : "gap-2")}>
        {links.map((item) => (
          <li key={item.key}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={item.label}
              aria-label={item.label}
              className={cn(
                "inline-flex items-center justify-center rounded-xl border border-border/80 bg-white text-ink transition hover:border-accent/40 hover:text-accent",
                // Mobile PWA: só ícone (evita quebra em 2 linhas).
                "size-11",
                // Desktop: ícone + rótulo.
                "md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2 md:text-sm md:font-medium",
                compact && "md:px-2.5 md:py-1.5 md:text-xs",
              )}
            >
              <Icon icon={item.icon} className="size-5 shrink-0 md:size-4" />
              <span className="hidden md:inline">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
