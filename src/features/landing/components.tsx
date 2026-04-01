import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import {
  Zap,
  Code,
  GitBranch,
  Terminal,
  HardDrive,
  Database,
  ShieldCheck,
  Lock,
  Plug,
  ScanSearch,
  Tags,
  FileText,
  Clock,
  BarChart3,
  Search,
  ChevronDown,
  Copy,
  Check,
  MessageSquare,
  Workflow,
  Cpu,
  FolderSearch,
  FileJson,
  FileCode,
  Activity,
  Sparkles,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as Easing } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 text-zinc-100 font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          PromptTrace
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">How It Works</a>
          <a href="#sources" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">Sources</a>
          <a href="#faq" className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">FAQ</a>
        </div>

        <a
          href="https://github.com/ahmetseha/prompt-trace"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white transition-colors"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-0">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 h-[600px] w-[800px] rounded-full bg-indigo-600/8 blur-[140px]" />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl text-center"
      >
        <motion.div variants={fadeUp} className="mb-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Open source &middot; Local-first &middot; No signup
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl"
        >
          See how you actually use{" "}
          <span className="text-indigo-400">AI coding tools</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-base text-zinc-500 leading-relaxed sm:text-lg">
          PromptTrace scans your local AI assistant histories, classifies every prompt, and gives you a dashboard to understand your workflow. All data stays on your machine.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-sm">
            <span className="text-zinc-600 select-none">$</span>
            <span className="text-zinc-300">npx prompttrace</span>
            <CopyButton text="npx prompttrace" />
          </div>
          <a
            href="https://github.com/ahmetseha/prompt-trace"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            <Code className="h-3.5 w-3.5" />
            View on GitHub
          </a>
        </motion.div>

        {/* Dashboard Screenshot */}
        <motion.div
          variants={fadeUp}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="ml-3 text-[10px] text-zinc-600">localhost:3001/dashboard</span>
            </div>
            <img
              src="/dashboard-preview.png"
              alt="PromptTrace Dashboard"
              className="rounded-lg"
            />
          </div>
          {/* Fade to black at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats Strip
// ---------------------------------------------------------------------------
export function TrustStrip() {
  const stats = [
    { value: "16+", label: "AI tools detected", icon: Plug },
    { value: "100%", label: "Local & private", icon: Lock },
    { value: "14", label: "Prompt categories", icon: Tags },
    { value: "<1min", label: "Setup time", icon: Clock },
  ];

  return (
    <section className="border-y border-zinc-800/50 px-6 py-10">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeIn} className="text-center">
            <s.icon className="mx-auto h-4 w-4 text-zinc-600 mb-2" />
            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Terminal Preview
// ---------------------------------------------------------------------------
export function ProblemSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            One command. Full visibility.
          </h2>
          <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
            Run <code className="text-zinc-300 bg-zinc-800 rounded px-1.5 py-0.5 text-sm">npx prompttrace</code> and instantly see how you use AI across all your projects.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-3xl"
        >
          {/* Terminal window */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-zinc-800/80 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 text-[11px] text-zinc-600 font-mono">Terminal</span>
            </div>
            <div className="px-5 py-4 font-mono text-sm leading-7">
              <div><span className="text-zinc-600">$</span> <span className="text-zinc-300">npx prompttrace</span></div>
              <div className="text-zinc-600 mt-3">  PromptTrace v0.2.3</div>
              <div className="text-zinc-600">  Local-first prompt intelligence for developers</div>
              <div className="mt-3">
                <span className="text-emerald-500">  Scanning Claude Code...</span>
                <span className="text-zinc-400"> 114 prompts from 7 projects</span>
              </div>
              <div>
                <span className="text-emerald-500">  Scanning Cursor...</span>
                <span className="text-zinc-400"> 25 prompts from 3 projects</span>
              </div>
              <div className="mt-2 text-zinc-300">  Total: 139 prompts ingested</div>
              <div className="mt-3 text-indigo-400">  Dashboard ready at http://localhost:3001/dashboard</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// What You Get
// ---------------------------------------------------------------------------
export function SolutionSection() {
  const items = [
    { icon: Activity, title: "Activity overview", desc: "Daily prompt volume, category trends, model usage at a glance" },
    { icon: Eye, title: "Prompt explorer", desc: "Search, filter, and browse every prompt across all your AI tools" },
    { icon: Sparkles, title: "Template extraction", desc: "Automatically detects reusable prompt patterns from your history" },
    { icon: Clock, title: "Session timelines", desc: "See each coding session as a chronological prompt timeline" },
    { icon: BarChart3, title: "Project analytics", desc: "Per-project breakdown of AI usage, categories, and files touched" },
    { icon: Tags, title: "Smart classification", desc: "14 categories and 8 intents assigned automatically to every prompt" },
  ];

  return (
    <section id="features" className="px-6 py-24 border-t border-zinc-800/50">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            What you get
          </h2>
          <p className="mt-4 text-zinc-500">Everything runs locally. Nothing leaves your machine.</p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="group rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all"
            >
              <item.icon className="h-5 w-5 text-zinc-600 mb-3 group-hover:text-indigo-400 transition-colors" />
              <h3 className="text-sm font-semibold text-zinc-200">{item.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Feature Grid (kept for compatibility)
// ---------------------------------------------------------------------------
export function FeatureGrid() {
  return null;
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------
export function HowItWorks() {
  const steps = [
    { num: "1", icon: Terminal, title: "Run the command", desc: "npx prompttrace auto-detects installed AI tools on your machine" },
    { num: "2", icon: ScanSearch, title: "Sources are scanned", desc: "Reads local history files from Claude Code, Cursor, and others" },
    { num: "3", icon: Cpu, title: "Prompts are analyzed", desc: "Each prompt is classified, scored, and grouped into templates" },
    { num: "4", icon: BarChart3, title: "Dashboard opens", desc: "Browse your insights, search history, explore sessions" },
  ];

  return (
    <section id="how-it-works" className="px-6 py-24 border-t border-zinc-800/50">
      <div className="mx-auto max-w-5xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            How it works
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((s) => (
            <motion.div key={s.num} variants={fadeUp} className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <s.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-[10px] font-mono text-indigo-500/60 tracking-widest uppercase">Step {s.num}</span>
              <h3 className="mt-1 text-sm font-semibold text-zinc-200">{s.title}</h3>
              <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Supported Sources
// ---------------------------------------------------------------------------
export function SupportedSources() {
  const sources = [
    { name: "Claude Code", icon: Terminal },
    { name: "Cursor", icon: MessageSquare },
    { name: "GitHub Copilot", icon: GitBranch },
    { name: "Gemini CLI", icon: Workflow },
    { name: "Codex CLI", icon: Cpu },
    { name: "JSON Import", icon: FileJson },
    { name: "Markdown", icon: FileCode },
  ];

  return (
    <section id="sources" className="px-6 py-24 border-t border-zinc-800/50">
      <div className="mx-auto max-w-5xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            Supported sources
          </h2>
          <p className="mt-4 text-zinc-500">Reads directly from local history files. Adapter-based architecture.</p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {sources.map((s) => (
            <motion.div
              key={s.name}
              variants={fadeIn}
              className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all"
            >
              <s.icon className="h-4 w-4" />
              {s.name}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Privacy Section
// ---------------------------------------------------------------------------
export function PrivacySection() {
  return (
    <section className="px-6 py-24 border-t border-zinc-800/50">
      <div className="mx-auto max-w-2xl text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <ShieldCheck className="mx-auto h-8 w-8 text-zinc-700 mb-5" />
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            100% local. Zero telemetry.
          </h2>
          <p className="mt-4 text-zinc-500 leading-relaxed">
            Your prompt data never leaves your machine. PromptTrace stores everything in a local SQLite
            database at <code className="text-zinc-400 bg-zinc-800 rounded px-1 py-0.5 text-xs">~/.prompttrace/data/</code>.
            No cloud, no accounts, no API keys. Open source under MIT.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
const faqs = [
  { q: "Does my data leave my machine?", a: "No. Everything runs locally. PromptTrace stores data in a SQLite database on your disk. There are no network requests, no telemetry, no cloud sync." },
  { q: "Which AI tools are supported?", a: "Claude Code and Cursor have full adapter support. Copilot, Gemini CLI, and Codex CLI adapters are planned. You can also import from JSON or Markdown files." },
  { q: "Do I need an API key?", a: "No. PromptTrace doesn't call any external APIs. Classification and scoring use local rule-based heuristics." },
  { q: "How does classification work?", a: "Each prompt is matched against weighted keyword lists for 14 categories (bug-fixing, refactoring, testing, etc.) and 8 intents (ask, instruct, generate, fix, etc.). The architecture is designed to support ML-based classification later." },
  { q: "Is this free?", a: "Yes. PromptTrace is open source under the MIT license." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800/80">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="text-sm text-zinc-300">{q}</span>
        <ChevronDown className={cn("h-4 w-4 text-zinc-600 transition-transform", open && "rotate-180")} />
      </button>
      <div className={cn("overflow-hidden transition-all", open ? "max-h-96 pb-4" : "max-h-0")}>
        <p className="text-sm text-zinc-500 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="px-6 py-24 border-t border-zinc-800/50">
      <div className="mx-auto max-w-2xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">FAQ</h2>
        </motion.div>
        {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------
export function CTASection() {
  return (
    <section className="px-6 py-24 border-t border-zinc-800/50">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
          Try it now
        </h2>
        <p className="mt-3 text-zinc-500">Takes less than a minute. No signup required.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-sm">
            <span className="text-zinc-600 select-none">$</span>
            <span className="text-zinc-300">npx prompttrace</span>
            <CopyButton text="npx prompttrace" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Zap className="h-3.5 w-3.5" />
          PromptTrace
        </div>
        <div className="flex items-center gap-5 text-xs text-zinc-600">
          <a href="https://github.com/ahmetseha/prompt-trace" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">GitHub</a>
          <a href="https://github.com/ahmetseha/prompt-trace/tree/main/docs" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">Docs</a>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
