"use client";

import Image from "next/image";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import {
  getPortfolioSection,
  type PortfolioSection,
} from "@/lib/portfolio";

const projects = [
  {
    ref: "PRJ-001",
    title: "untitled project one",
    desc: "placeholder — a small tool that does one thing carefully. description pending.",
    tags: "typescript · react",
  },
  {
    ref: "PRJ-002",
    title: "untitled project two",
    desc: "placeholder — a command-line thing, built to learn something new.",
    tags: "rust · cli",
  },
  {
    ref: "PRJ-003",
    title: "untitled project three",
    desc: "placeholder — an experiment with data, math leaking into code.",
    tags: "python · numpy",
  },
  {
    ref: "PRJ-004",
    title: "untitled project four",
    desc: "placeholder — a web app; forms, databases, the usual weather.",
    tags: "next.js · postgres",
  },
] as const;

const contacts = [
  { label: "mail", value: "wzishine@gmail.com", href: "mailto:wzishine@gmail.com" },
  { label: "github", value: "github.com/zishinew", href: "https://github.com/zishinew" },
  { label: "linkedin", value: "linkedin.com/in/zishine", href: "https://www.linkedin.com/in/zishine/" },
] as const;

const degradedText =
  "nothing seems to lead to where we thought it would. the sky here is a scanned " +
  "photograph of a sky, the wires cross it in fours and sevens. i keep the files " +
  "in folders named after months i don't remember. if you find this, it means the " +
  "archive survived another export.";

function SectionHeading({ section }: { section: PortfolioSection }) {
  const current = getPortfolioSection(section);
  const title = section === "projects" ? "index of works" : section;

  return (
    <div className="mb-8 flex items-center gap-4 sm:mb-10">
      <span className="font-pixel text-[12px] text-ac-ash">{current.number}</span>
      <h1 className="font-mono text-[11px] uppercase tracking-[0.4em] text-ac-fog">
        {title}
      </h1>
      <span className="ac-hairline h-px flex-1" />
      {section === "projects" && (
        <span className="hidden font-mono text-[10px] tracking-[0.2em] text-ac-ash sm:block">
          004 entries
        </span>
      )}
    </div>
  );
}

function About() {
  return (
    <div className="relative grid gap-10 md:grid-cols-12">
      <div className="md:col-span-6 md:col-start-2">
        <p className="text-lg leading-relaxed">
          Hey! I&apos;m Zishine, a software developer and Mathematics student at
          the University of Waterloo. Outside of building software, some of the
          things I love doing are producing music, graphic design, and playing
          basketball. All music and art on this site was made by me, so take a
          look around!
        </p>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-ash">
          currently — studying, building, archiving
        </p>
      </div>

      <div className="relative md:col-span-4 md:-mt-6">
        <div className="ac-plate relative aspect-[3/4] w-full max-w-[280px]">
          <Image
            src="/aboutme.png"
            alt="monochrome personal photo collage"
            fill
            sizes="(min-width: 768px) 280px, 70vw"
            className="object-cover"
          />
        </div>
        <p className="mt-2 flex max-w-[280px] justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-ac-ash">
          <span>fig. 01 — about me</span>
          <span className="tabular-nums">aboutme.png</span>
        </p>
      </div>

      <p
        className="ac-degraded hidden text-sm leading-relaxed md:absolute md:right-0 md:top-0 md:block md:w-12"
        aria-hidden
      >
        {degradedText}
      </p>
    </div>
  );
}

function Education() {
  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="md:col-span-8">
        <div className="border-l-2 border-ac-steel/60 pl-6">
          <h2 className="text-2xl lowercase leading-snug text-ac-halo">
            <a
              href="https://uwaterloo.ca/"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 transition-opacity hover:opacity-65 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ac-ash"
            >
              <Image
                src="/University_of_Waterloo_seal.png"
                alt=""
                width={32}
                height={32}
                sizes="32px"
                className="size-[1em] shrink-0 object-contain"
              />
              <span className="underline decoration-ac-steel/80 decoration-1 underline-offset-4 transition-colors group-hover:decoration-ac-halo">
                university of waterloo
              </span>
            </a>
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-ash">
            2025 — present
          </p>
          <p className="mt-3 text-lg leading-relaxed">
            bachelor of mathematics
          </p>
          <p className="mt-2 text-sm text-ac-fog">
            coursework in algorithms, data structures, linear algebra, and software engineering.
          </p>
        </div>
      </div>

      <div className="hidden md:col-span-4 md:block">
        <div className="ac-plate relative ml-auto aspect-square w-full max-w-[240px]">
          <Image src="/waterloo-preview.jpg" alt="campus building" fill sizes="240px" className="object-cover" />
        </div>
        <p className="mt-2 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-ac-ash">
          campus_01.jpg
        </p>
      </div>
    </div>
  );
}

function Experiences() {
  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="space-y-8 md:col-span-8">
        <div className="border-l-2 border-ac-steel/60 pl-6">
          <h2 className="text-2xl lowercase leading-snug text-ac-halo">software developer</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-ash">2024 — present</p>
          <p className="mt-3 text-sm text-ac-fog">
            building tools and interfaces. working with typescript, react, and rust.
          </p>
        </div>
        <div className="border-l-2 border-ac-steel/60 pl-6">
          <h2 className="text-2xl lowercase leading-snug text-ac-halo">teaching assistant</h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-ash">2024</p>
          <p className="mt-3 text-sm text-ac-fog">helping students with algorithms and data structures.</p>
        </div>
      </div>

      <div className="hidden md:col-span-4 md:block">
        <div className="ac-plate relative ml-auto aspect-[3/4] w-full max-w-[240px]">
          <Image src="/experiences.png" alt="experiences archive collage" fill sizes="240px" className="object-cover" />
        </div>
        <p className="mt-2 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-ac-ash">
          experiences.png
        </p>
      </div>
    </div>
  );
}

function Projects() {
  const { playHover, playClick } = useSoundEffects();

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <ul className="md:col-span-8">
        {projects.map((project) => (
          <li
            key={project.ref}
            className="group grid cursor-pointer grid-cols-[auto_1fr_auto] items-baseline gap-x-5 border-t border-ac-steel/60 py-5 last:border-b"
            onMouseEnter={playHover}
            onClick={(event) => {
              const target = event.target;
              if (target instanceof Element && target.closest("a[href]")) {
                return;
              }

              playClick();
            }}
          >
            <span className="font-pixel text-[11px] text-ac-ash transition-transform duration-300 group-hover:translate-x-1">
              {project.ref}
            </span>
            <div>
              <h2 className="text-xl lowercase leading-snug transition-colors duration-300 group-hover:text-ac-halo sm:text-2xl">
                {project.title}
              </h2>
              <p className="mt-1 max-w-lg text-sm text-ac-fog">{project.desc}</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.25em] text-ac-ash">
                {project.tags}
              </p>
            </div>
            <span className="font-mono text-sm text-ac-ash transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-ac-frost">
              ↗
            </span>
          </li>
        ))}
      </ul>

      <div className="hidden md:col-span-4 md:block">
        <div className="ac-plate relative ml-auto aspect-square w-4/5 rotate-1">
          <Image src="/projects.png" alt="projects archive collage" fill sizes="320px" className="object-cover" />
        </div>
        <p className="mt-2 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-ac-ash">
          projects.png
        </p>
      </div>
    </div>
  );
}

function Contact() {
  const { playHover } = useSoundEffects();

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="md:col-span-7">
        <p className="mb-8 max-w-md text-lg leading-relaxed">
          the archive accepts correspondence. send word through any of the channels below.
        </p>
        <ul className="font-mono text-sm">
          {contacts.map((contact) => (
            <li key={contact.label} className="border-t border-ac-steel/60 last:border-b">
              <a
                href={contact.href}
                target={contact.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noreferrer"
                className="group flex items-baseline justify-between gap-4 py-4 transition-[color,transform] duration-300 hover:translate-x-1 hover:text-ac-halo"
                onMouseEnter={playHover}
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-ac-ash underline decoration-ac-steel/70 decoration-1 underline-offset-4 transition-colors duration-300 group-hover:text-ac-frost group-hover:decoration-ac-frost">
                  {contact.label}
                </span>
                <span className="text-right text-ac-fog underline decoration-ac-steel/70 decoration-1 underline-offset-4 transition-colors duration-300 group-hover:text-ac-halo group-hover:decoration-ac-halo">
                  {contact.value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden md:col-span-4 md:col-start-9 md:block">
        <div className="ac-plate relative aspect-[3/4] w-full max-w-[240px]">
          <Image src="/contact.png" alt="contact archive collage" fill sizes="240px" className="object-cover" />
        </div>
        <p className="mt-2 flex max-w-[240px] justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-ac-ash">
          <span>fig. 02</span>
          <span className="font-pixel normal-case">contact.png</span>
        </p>
      </div>
    </div>
  );
}

const sectionContent = {
  about: About,
  education: Education,
  experiences: Experiences,
  projects: Projects,
  contact: Contact,
} satisfies Record<PortfolioSection, React.ComponentType>;

export default function PortfolioSectionView({
  section,
}: {
  section: PortfolioSection;
}) {
  const Content = sectionContent[section];

  return (
    <>
      <SectionHeading section={section} />
      <Content />
    </>
  );
}
