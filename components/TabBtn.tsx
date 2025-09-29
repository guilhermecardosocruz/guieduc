"use client";
import Link from "next/link";

export default function TabBtn({
  href,
  active,
  children,
  newTab = false,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  newTab?: boolean;
}) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-base font-medium transition";
  const style = active
    ? "bg-[color:var(--color-secondary)] text-white hover:opacity-90"
    : "border border-[color:var(--color-secondary)] text-[color:var(--color-secondary)] hover:bg-blue-50";
  return (
    <Link
      href={href}
      className={`${base} ${style}`}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
