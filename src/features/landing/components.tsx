"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import {
  Zap,
  Code,
  GitBranch,
  HardDrive,
  Database,
  ShieldCheck,
  Lock,
  Plug,
  AlertTriangle,
  Repeat,
  Layers,
  BookOpen,
  ScanSearch,
  Tags,
  FileText,
  Clock,
  BarChart3,
  Search,
  Terminal,
  ChevronDown,
  ArrowRight,
  Copy,
  Check,
  MessageSquare,
  Workflow,
  Cpu,
  FolderSearch,
  FileJson,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as Easing },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-zinc-500 hover:text-zinc-300 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TerminalSnippet
// ---------------------------------------------------------------------------
function TerminalSnippet({ command, className }: { command: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 font-mono text-sm",
        className
      )}
    >
      <span className="text-zinc-500 select-none">$</span>
      <span className="text-zinc-300">{command}</span>
      <CopyButton text={command} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("py-24 px-6", className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionTitle({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="mb-14 text-center"
    >
      <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
        {children}
      </h2>
      {sub && <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">{sub}</p>}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
export function Navbar() {
  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Sources", href: "#sources" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-zinc-100 font-semibold text-lg">
          <Zap className="h-5 w-5 text-indigo-500" />
          PromptTrace
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          View Dashboard
        </Link>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
export function Hero() {
  return (
    <Section className="relative overflow-hidden pt-32 pb-28">
      {/* Gradient decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[900px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[300px] w-[300px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center"
      >
        <motion.div variants={fadeUp} className="mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Open source and local-first
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-5xl font-bold tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl max-w-4xl"
        >
          Understand how you{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            prompt AI
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed"
        >
          Local-first prompt intelligence for developers. Scan your AI coding history,
          discover patterns, and extract reusable templates.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            View Dashboard Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
          >
            Get Started
          </a>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-10">
          <TerminalSnippet command="npx prompttrace init" />
        </motion.div>
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Trust Strip
// ---------------------------------------------------------------------------
const trustBadges = [
  { label: "Open Source", icon: Code },
  { label: "Local-First", icon: HardDrive },
  { label: "SQLite-Powered", icon: Database },
  { label: "No Signup Required", icon: ShieldCheck },
  { label: "Privacy Friendly", icon: Lock },
  { label: "Adapter-Based", icon: Plug },
];

export function TrustStrip() {
  return (
    <Section className="py-12 border-y border-zinc-800/60">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="flex flex-wrap justify-center gap-4"
      >
        {trustBadges.map((b) => (
          <motion.span
            key={b.label}
            variants={fadeIn}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-400"
          >
            <b.icon className="h-4 w-4 text-zinc-500" />
            {b.label}
          </motion.span>
        ))}
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Problem Section
// ---------------------------------------------------------------------------
const problems = [
  {
    icon: AlertTriangle,
    title: "Prompts get lost",
    description:
      "Your best AI interactions disappear into tool-specific history files that you never revisit.",
  },
  {
    icon: Repeat,
    title: "Patterns go unnoticed",
    description:
      "You repeat similar prompts without realizing you could templatize them for consistency and speed.",
  },
  {
    icon: Layers,
    title: "No cross-tool view",
    description:
      "Each AI tool keeps its own history format with no way to see the full picture in one place.",
  },
  {
    icon: BookOpen,
    title: "No learning loop",
    description:
      "Without analysis, you can\u2019t systematically improve your prompting or measure what works.",
  },
];

export function ProblemSection() {
  return (
    <Section>
      <SectionTitle>Your AI prompt history is scattered and invisible</SectionTitle>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-6 sm:grid-cols-2"
      >
        {problems.map((p) => (
          <motion.div
            key={p.title}
            variants={fadeUp}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <p.icon className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Solution Section
// ---------------------------------------------------------------------------
const solutionPoints = [
  "Scan local AI tool histories automatically",
  "Normalize prompts across different tools and formats",
  "Classify prompts by category and intent",
  "Surface reusable prompt templates",
  "Explore sessions and projects visually",
];

export function SolutionSection() {
  return (
    <Section>
      <SectionTitle>
        PromptTrace turns scattered history into structured insight
      </SectionTitle>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto max-w-2xl"
      >
        <ul className="space-y-4">
          {solutionPoints.map((point) => (
            <motion.li
              key={point}
              variants={fadeUp}
              className="flex items-start gap-3 text-zinc-300"
            >
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
              <span>{point}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Feature Grid
// ---------------------------------------------------------------------------
const features = [
  {
    icon: ScanSearch,
    title: "Multi-Source Scanning",
    description: "Connect Cursor, Claude Code, Copilot, and more through a unified adapter system.",
  },
  {
    icon: Tags,
    title: "Prompt Classification",
    description:
      "Automatic categorization by intent and topic so you can filter and analyze by type.",
  },
  {
    icon: FileText,
    title: "Template Extraction",
    description:
      "Find and save your most reusable prompt patterns as templates for future use.",
  },
  {
    icon: Clock,
    title: "Session Explorer",
    description: "Browse your AI sessions as timelines to understand how conversations evolve.",
  },
  {
    icon: BarChart3,
    title: "Project Insights",
    description:
      "See AI usage patterns across your projects, from prompt frequency to category distribution.",
  },
  {
    icon: Search,
    title: "Search Everything",
    description: "Full-text search across all your prompt history, with filters and instant results.",
  },
];

export function FeatureGrid() {
  return (
    <Section id="features">
      <SectionTitle sub="Everything you need to analyze, organize, and improve your AI prompting workflow.">
        Built for developers who use AI daily
      </SectionTitle>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10">
              <f.icon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
const steps = [
  {
    step: "01",
    title: "Connect your sources",
    description:
      "Point PromptTrace at your local AI tool directories. It auto-detects Cursor, Claude Code, Copilot, and more.",
    icon: FolderSearch,
  },
  {
    step: "02",
    title: "Scan and analyze",
    description:
      "Prompts are parsed, normalized, and classified automatically using adapter-based extraction and rule-based heuristics.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Browse insights",
    description:
      "Explore dashboards, templates, sessions, and search your entire prompt history from a single interface.",
    icon: BarChart3,
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" className="border-t border-zinc-800/60">
      <SectionTitle>How it works</SectionTitle>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-8 sm:grid-cols-3"
      >
        {steps.map((s) => (
          <motion.div key={s.step} variants={fadeUp} className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <s.icon className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-xs font-mono text-indigo-500 tracking-widest">{s.step}</span>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Supported Sources
// ---------------------------------------------------------------------------
const sources = [
  { name: "Cursor", icon: MessageSquare },
  { name: "Claude Code", icon: Terminal },
  { name: "GitHub Copilot", icon: GitBranch },
  { name: "Gemini CLI", icon: Workflow },
  { name: "Codex CLI", icon: Cpu },
  { name: "JSON Import", icon: FileJson },
  { name: "Markdown Import", icon: FileCode },
];

export function SupportedSources() {
  return (
    <Section id="sources">
      <SectionTitle sub="PromptTrace reads directly from local history files. No API keys, no cloud sync.">
        Supported sources
      </SectionTitle>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="flex flex-wrap justify-center gap-4"
      >
        {sources.map((s) => (
          <motion.div
            key={s.name}
            variants={fadeUp}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-3 hover:border-zinc-700 transition-colors"
          >
            <s.icon className="h-5 w-5 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">{s.name}</span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Privacy Section
// ---------------------------------------------------------------------------
const privacyPoints = [
  "PromptTrace runs entirely locally",
  "All data stored in a local SQLite database",
  "No cloud sync, no telemetry, no tracking",
  "Open source \u2014 inspect every line of code",
];

export function PrivacySection() {
  return (
    <Section className="border-t border-zinc-800/60">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            Your data never leaves your machine
          </h2>
        </motion.div>

        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-10 space-y-4"
        >
          {privacyPoints.map((point) => (
            <motion.li
              key={point}
              variants={fadeUp}
              className="flex items-center justify-center gap-3 text-zinc-300"
            >
              <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
              <span>{point}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// FAQ Section
// ---------------------------------------------------------------------------
const faqs = [
  {
    q: "Does my data leave my machine?",
    a: "No. PromptTrace is fully local. Your prompt history stays on your machine in a SQLite database. There is no cloud component, no telemetry, and no external API calls.",
  },
  {
    q: "Which AI tools are supported?",
    a: "Currently supports Cursor, Claude Code, GitHub Copilot CLI, Gemini CLI, and Codex CLI. You can also import prompt history from JSON or Markdown files. The adapter architecture makes it easy to add new sources.",
  },
  {
    q: "Do I need an API key?",
    a: "No. PromptTrace does not call any AI APIs. Classification and analysis are done locally using rule-based heuristics.",
  },
  {
    q: "Can I import my own prompt history?",
    a: "Yes. You can import JSON files following the PromptTrace schema, or Markdown conversation files. See the documentation for the expected format.",
  },
  {
    q: "Is this open source?",
    a: "Yes. PromptTrace is released under the MIT license. Contributions are welcome.",
  },
  {
    q: "How does prompt classification work?",
    a: "PromptTrace uses rule-based heuristics to classify prompts into categories like bug-fixing, refactoring, testing, and more. The architecture supports future ML-based classification.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-medium text-zinc-200">{q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm leading-relaxed text-zinc-400">{a}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <Section id="faq">
      <SectionTitle>Frequently asked questions</SectionTitle>
      <div className="mx-auto max-w-2xl">
        {faqs.map((f) => (
          <FAQItem key={f.q} {...f} />
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// CTA Section
// ---------------------------------------------------------------------------
export function CTASection() {
  return (
    <Section id="get-started" className="border-t border-zinc-800/60">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        {/* Subtle glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-indigo-600/8 blur-[100px]" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          Start understanding your AI workflow
        </h2>
        <p className="mt-4 text-lg text-zinc-400">
          PromptTrace is free, open source, and takes under a minute to set up.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            View Dashboard Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <TerminalSnippet command="npx prompttrace init" />
        </div>
      </motion.div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 py-12 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <Link href="/" className="flex items-center gap-2 text-zinc-100 font-semibold">
            <Zap className="h-4 w-4 text-indigo-500" />
            PromptTrace
          </Link>
          <p className="mt-1 text-xs text-zinc-500">
            Local-first prompt intelligence for developers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <a href="#" className="hover:text-zinc-300 transition-colors flex items-center gap-1">
            <Code className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a href="#" className="hover:text-zinc-300 transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-zinc-300 transition-colors">
            Contributing
          </a>
        </div>

        <div className="flex flex-col items-center gap-1 sm:items-end">
          <span className="text-xs text-zinc-600">
            Built with Next.js, TypeScript, and SQLite
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500">
            MIT License
          </span>
        </div>
      </div>
    </footer>
  );
}
