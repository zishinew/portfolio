export const portfolioSections = [
  {
    id: "about",
    label: "About me",
    number: "01",
    filename: "aboutme.png",
    timestamp: "00:04:12",
    previewSrc: "/aboutme.png",
    previewAlt: "monochrome personal photo collage",
  },
  {
    id: "education",
    label: "Education",
    number: "02",
    filename: "waterloo.png",
    timestamp: "02:03:23",
    previewSrc: "/waterloo-preview.jpg",
    previewAlt: "University of Waterloo campus and light rail collage",
  },
  {
    id: "experiences",
    label: "Experience",
    number: "03",
    filename: "experiences.png",
    timestamp: "00:24:11",
    previewSrc: "/experiences.png",
    previewAlt: "experiences archive collage",
  },
  {
    id: "projects",
    label: "Projects",
    number: "04",
    filename: "projects.png",
    timestamp: "04:04:00",
    previewSrc: "/projects.png",
    previewAlt: "projects archive collage",
  },
  {
    id: "contact",
    label: "Contact",
    number: "05",
    filename: "contact.png",
    timestamp: "00:00:07",
    previewSrc: "/contact.png",
    previewAlt: "contact archive collage",
  },
] as const;

export type PortfolioSection = (typeof portfolioSections)[number]["id"];

export function isPortfolioSection(value: string): value is PortfolioSection {
  return portfolioSections.some((section) => section.id === value);
}

export function getPortfolioSection(section: PortfolioSection) {
  return portfolioSections.find((item) => item.id === section)!;
}
