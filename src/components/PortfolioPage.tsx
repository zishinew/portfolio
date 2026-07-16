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
    title: "paddleon.ca",
    href: "https://paddleon.ca",
    desc: "kayaking spot finder and trip planner.",
    tags: "fastapi · python ·supabase · typescript · react",
  },
  {
    ref: "PRJ-002",
    title: "snake game ai",
    href: "https://github.com/zishinew/snake-game-ai",
    desc: "reinforcement learning model using dqn with PyTorch to automonously learn snake gameplay.",
    tags: "python · pytorch",
  },
  {
    ref: "PRJ-003",
    title: "findmygif",
    href: "https://findmygif-jet.vercel.app/",
    desc: "find the perfect gif for your instagram reel comment, or response to your friends .",
    tags: "next.js · typescript · react · fastapi",
  },
  {
    ref: "PRJ-004",
    title: "frymyresume.cv",
    href: "https://frymyresume.cv",
    desc: "helping students find jobs through AI-powered resume critique + a full internship interview pipeline ",
    tags: "fastapi · react · typescript",
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
    <div className="mb-8 flex min-w-0 items-center gap-3 sm:mb-10 sm:gap-4">
      <span className="font-pixel text-[12px] text-ac-ash">{current.number}</span>
      <h1 className="min-w-0 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-fog sm:text-[11px] sm:tracking-[0.4em]">
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
          currently — probably studying or building smth
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
          <h2 className="text-2xl lowercase leading-snug text-ac-halo">Software Engineer</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center">
              <Image
                src="/healthcarejobagencylogo.png"
                alt=""
                width={20}
                height={20}
                sizes="20px"
                className="max-h-5 max-w-5 object-contain"
              />
            </span>
            <p className="text-sm leading-tight text-ac-fog">healthcarejob.agency</p>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-ash">July 2026 — August 2026</p>
          <p className="mt-3 text-sm text-ac-fog">
            Building software for seniors to share their stories and educate youth through conversations with AI.
          </p>
        </div>
        <div className="border-l-2 border-ac-steel/60 pl-6">
          <h2 className="text-2xl lowercase leading-snug text-ac-halo">AI Engineer</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center">
              <Image
                src="/cyclogo.png"
                alt=""
                width={20}
                height={20}
                sizes="20px"
                className="max-h-5 max-w-5 object-contain"
              />
            </span>
            <p className="text-sm leading-tight text-ac-fog">CYC</p>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ac-ash">May 2026 — July 2026</p>
          <p className="mt-3 text-sm text-ac-fog">Developing a survey platform used by thousands of users and deploying AI models for survey analysis.</p>
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
  const { playHover } = useSoundEffects();

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <ul className="md:col-span-8">
        {projects.map((project) => (
          <li
            key={project.ref}
            className="border-t border-ac-steel/60 last:border-b"
          >
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer"
              onMouseEnter={playHover}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ac-frost sm:grid-cols-[auto_1fr_auto] sm:gap-x-5"
            >
              <span className="col-span-2 mb-2 font-pixel text-[10px] text-ac-ash transition-transform duration-300 group-hover:translate-x-1 sm:col-span-1 sm:mb-0 sm:text-[11px]">
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
            </a>
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
          Get in contact! Send word through any of the channels below.
        </p>
        <ul className="font-mono text-sm">
          {contacts.map((contact) => (
            <li key={contact.label} className="border-t border-ac-steel/60 last:border-b">
              <a
                href={contact.href}
                target={contact.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noreferrer"
                className="group flex min-h-14 flex-col items-start justify-center gap-1 py-3 transition-[color,transform] duration-300 hover:translate-x-1 hover:text-ac-halo sm:min-h-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:py-4"
                onMouseEnter={playHover}
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-ac-ash underline decoration-ac-steel/70 decoration-1 underline-offset-4 transition-colors duration-300 group-hover:text-ac-frost group-hover:decoration-ac-frost">
                  {contact.label}
                </span>
                <span className="max-w-full break-all text-left text-ac-fog underline decoration-ac-steel/70 decoration-1 underline-offset-4 transition-colors duration-300 group-hover:text-ac-halo group-hover:decoration-ac-halo sm:break-normal sm:text-right">
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
