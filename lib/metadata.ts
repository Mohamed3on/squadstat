import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site-config";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export function createPageMetadata({ title, description, path, keywords = [] }: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      url: absoluteUrl(path),
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
  };
}
