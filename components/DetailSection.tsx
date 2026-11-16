import type { ReactNode } from "react";

/** A top-level section of a detail page: a Pixel head, a line saying what it measures, and an
 *  anchor so the hero (or a shared link) can jump straight to it. */
export function DetailSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h2 id={`${id}-heading`} className="text-xl font-pixel text-text-primary sm:text-2xl">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
