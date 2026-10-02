"use client";

import { Children, useCallback, useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailDeckProps {
  /** `count` rides beside the label: how many rows the section holds. */
  sections: { value: string; label: string; count?: number }[];
  children: ReactNode;
}

export function DetailDeck({ sections, children }: DetailDeckProps) {
  const keys = sections.map((s) => s.value);
  const keySet = new Set(keys);
  const panels = Children.toArray(children);

  const [active, setActive] = useState(keys[0]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (keySet.has(hash)) setActive(hash);

    const onHashChange = () => {
      const h = window.location.hash.slice(1);
      if (keySet.has(h)) setActive(h);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onValueChange = useCallback((v: string) => {
    setActive(v);
    window.history.replaceState(null, "", `#${v}`);
  }, []);

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-[linear-gradient(180deg,rgba(13,17,23,0.94),rgba(8,10,12,0.96))]">
        <div className="px-5 py-4 sm:px-6">
          <Tabs value={active} onValueChange={onValueChange}>
            <TabsList>
              {sections.map((section) => (
                <TabsTrigger key={section.value} value={section.value}>
                  {section.label}
                  {section.count !== undefined && (
                    <span className="ml-1.5 font-value text-xs text-text-muted">
                      {section.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="p-5 sm:p-6">{panels[keys.indexOf(active)]}</div>
      </div>
    </section>
  );
}
