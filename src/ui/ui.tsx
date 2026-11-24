// The small building blocks every pane uses.

import { type ClassValue, clsx } from "clsx";
import { Check, Copy } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { classColor } from "~/lib/classes";
import { m } from "~/paraglide/messages.js";

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}

type ButtonProps = ComponentProps<"button"> & { variant?: "solid" | "outline" | "ghost" };

export function Button({ variant = "outline", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-colors disabled:opacity-50",
        variant === "solid" && "bg-accent text-white hover:opacity-90",
        variant === "outline" && "border border-line-strong bg-surface hover:bg-hover",
        variant === "ghost" && "text-ink-soft hover:bg-hover hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

/** A button that shows only an icon; `label` is its accessible name and tooltip. */
export function IconButton({
  label,
  ...props
}: Omit<ButtonProps, "aria-label"> & { label: string }) {
  return (
    <Button
      variant="ghost"
      aria-label={label}
      title={label}
      className="w-7 px-0 justify-center"
      {...props}
    />
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-raised px-1 font-mono text-2xs text-ink-faint">
      {children}
    </kbd>
  );
}

/** The colour dot of a Unity class. */
export function ClassDot({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="size-2 shrink-0 rounded-[3px]"
      style={{ background: classColor(name) }}
    />
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-1.5 mt-4 text-2xs font-medium text-ink-faint first:mt-0">{children}</h3>;
}

/** A key and its value, as a row of a definition list. */
export function Fact({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 py-1">
      <dt className="text-ink-soft">{name}</dt>
      <dd className="min-w-0 break-all">{children}</dd>
    </div>
  );
}

export function CopyButton({ text, label = m.copy() }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <IconButton label={copied ? m.copied() : label} onClick={copy} className="size-6">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </IconButton>
  );
}

export function Pane({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-line px-3">
        <h2 className="flex-1 truncate text-2xs font-medium text-ink-soft">{title}</h2>
        {actions}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
