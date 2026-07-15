import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioApp from "@/components/PortfolioApp";
import {
  getPortfolioSection,
  isPortfolioSection,
  portfolioSections,
  type PortfolioSection,
} from "@/lib/portfolio";

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { section: [] },
    ...portfolioSections.map(({ id }) => ({ section: [id] })),
  ];
}

function readSection(
  segments: string[] | undefined,
): PortfolioSection | null {
  if (!segments || segments.length === 0) {
    return null;
  }

  if (segments.length !== 1 || !isPortfolioSection(segments[0])) {
    notFound();
  }

  return segments[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}): Promise<Metadata> {
  const section = readSection((await params).section);

  if (!section) {
    return {
      title: "zishine wang — archive",
    };
  }

  return {
    title: `${getPortfolioSection(section).label.toLowerCase()} — zishine wang`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const initialSection = readSection((await params).section);

  return <PortfolioApp initialSection={initialSection} />;
}
