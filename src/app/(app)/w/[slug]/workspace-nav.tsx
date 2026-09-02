"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Projects" },
  { href: "members", label: "Members" },
  { href: "settings", label: "Settings" },
] as const;

export function WorkspaceNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/w/${slug}`;

  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const href = tab.href ? `${base}/${tab.href}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.href || "home"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
