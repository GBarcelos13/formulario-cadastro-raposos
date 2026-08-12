"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/solicitacoes", label: "Solicitações", icon: ListChecks },
  { href: "/alunos", label: "Alunos", icon: Users },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
