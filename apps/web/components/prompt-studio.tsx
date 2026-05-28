"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  LayoutGrid,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Palette,
  Plus,
  Presentation,
  Save,
  Settings2,
  Sparkles,
  WandSparkles,
  X
} from "lucide-react";
import {
  DeckSection,
  DocumentIR,
  ExportOption,
  fileUrl,
  generateDocument,
  GenerateResponse,
  getMe,
  googleLogin,
  login,
  signup,
  UserProfile,
  exportEditedDocument
} from "@/lib/api";

const samplePrompt =
  "Create a 10-slide PPT on AI in healthcare for engineering students with charts, diagrams, examples, and speaker notes.";

const promptStarters = [
  "Startup pitch deck for an AI study planner with market size, product roadmap, and financial slide.",
  "Renewable energy presentation for college seminar with charts, diagrams, and speaker notes.",
  "Intrusion detection systems using CICIDS2017 dataset with architecture diagram and results analysis."
];

const layoutOptions = [
  "hero_statement",
  "two_column_cards",
  "diagram_flow",
  "chart_focus",
  "timeline",
  "comparison_table",
  "quote_insight"
];

const designStyles = ["Academic modern", "Startup pitch", "Minimal executive", "Technical report", "Creative classroom"];

export function PromptStudio() {
  const [prompt, setPrompt] = useState(samplePrompt);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [document, setDocument] = useState<DocumentIR | null>(null);
  const [exports, setExports] = useState<ExportOption[]>([]);
  const [selectedSection, setSelectedSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [options, setOptions] = useState({
    slides: 10,
    designStyle: designStyles[0],
    layoutPack: "Balanced 7-layout deck",
    charts: true,
    speakerNotes: true,
    citations: false
  });

  useEffect(() => {
    const stored = window.localStorage.getItem("presentationai_token");
    if (!stored) return;
    setToken(stored);
    getMe(stored).then(setUser).catch(() => {
      window.localStorage.removeItem("presentationai_token");
      setToken(null);
    });
  }, []);

  const usagePercent = user ? Math.min(100, Math.round((user.monthly_used / user.monthly_limit) * 100)) : 0;
  const activeSection = document?.sections[selectedSection];
  const selectedBullets = useMemo(() => findBullets(activeSection), [activeSection]);

  async function onAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = authMode === "signup"
        ? await signup(form.name, form.email, form.password)
        : await login(form.email, form.password);
      completeAuth(response.token, response.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function onGoogleLogin() {
    if (!form.email.trim()) {
      setAuthError("Enter your Google email first.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await googleLogin({
        email: form.email,
        name: form.name || form.email.split("@")[0],
        google_id: `local_google_${form.email.toLowerCase()}`
      });
      completeAuth(response.token, response.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function completeAuth(nextToken: string, nextUser: UserProfile) {
    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem("presentationai_token", nextToken);
  }

  async function onGenerate(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await generateDocument(buildPrompt(), token, {
        preferred_length: options.slides,
        design_style: options.designStyle,
        layout_pack: options.layoutPack
      });
      setResult(response);
      setDocument(response.document);
      setExports(response.exports);
      setSelectedSection(0);
      setUser(await getMe(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function onExportEdited() {
    if (!token || !document) return;
    setExporting(true);
    setError(null);
    try {
      setExports(await exportEditedDocument(document, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function buildPrompt() {
    const extras = [
      options.charts ? "include charts" : "",
      options.speakerNotes ? "include speaker notes" : "",
      options.citations ? "include references" : ""
    ].filter(Boolean).join(", ");
    return `${prompt}\n\nDesign style: ${options.designStyle}. Layout pack: ${options.layoutPack}. ${extras}`;
  }

  function logout() {
    window.localStorage.removeItem("presentationai_token");
    setToken(null);
    setUser(null);
    setResult(null);
    setDocument(null);
    setExports([]);
  }

  function updateDocument(updater: (draft: DocumentIR) => DocumentIR) {
    setDocument((current) => current ? updater(structuredClone(current)) : current);
  }

  function updateSection(index: number, updater: (section: DeckSection) => DeckSection) {
    updateDocument((draft) => {
      draft.sections[index] = updater(draft.sections[index]);
      return draft;
    });
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
        <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
              <WandSparkles size={22} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">PresentationAI</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">Generate, edit, and export presentation decks.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Sign in to create structured content, choose a deck style, edit every slide on the website, then download the final PPTX.
            </p>
          </div>

          <form onSubmit={onAuthSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{authMode === "signup" ? "Create account" : "Welcome back"}</h2>
                <p className="mt-1 text-sm text-slate-500">Use email or Google to continue.</p>
              </div>
              <Presentation className="text-sky-700" size={24} />
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm">
              <button type="button" onClick={() => setAuthMode("login")} className={`rounded px-3 py-2 font-medium ${authMode === "login" ? "bg-white shadow-sm" : "text-slate-500"}`}>Login</button>
              <button type="button" onClick={() => setAuthMode("signup")} className={`rounded px-3 py-2 font-medium ${authMode === "signup" ? "bg-white shadow-sm" : "text-slate-500"}`}>Sign up</button>
            </div>

            <div className="space-y-3">
              {authMode === "signup" ? (
                <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              ) : null}
              <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <input className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </div>

            <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={authLoading}>
              {authLoading ? <Loader2 className="animate-spin" size={17} /> : <Mail size={17} />}
              {authMode === "signup" ? "Create account" : "Login"}
            </button>
            <button type="button" onClick={onGoogleLogin} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60" disabled={authLoading}>
              <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-xs font-bold text-sky-700">G</span>
              Continue with Google
            </button>
            {authError ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p> : null}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
              <WandSparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">PresentationAI</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOptionsOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-50">
              <Settings2 size={17} /> Options
            </button>
            <button type="button" onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-50">
              <LogOut size={17} /> Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 xl:grid-cols-[360px_1fr_300px]">
        <aside className="space-y-4">
          <form onSubmit={onGenerate} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-sky-700" />
              <h2 className="font-semibold">Prompt</h2>
            </div>
            <textarea className="min-h-56 w-full resize-none rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-sky-500" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <button className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={17} /> : <ArrowRight size={17} />}
              {loading ? "Designing deck..." : "Generate presentation"}
            </button>
            {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Plus size={18} className="text-sky-700" />
              <h2 className="font-semibold">Starters</h2>
            </div>
            <div className="space-y-2">
              {promptStarters.map((item) => (
                <button key={item} type="button" onClick={() => setPrompt(item)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm leading-5 text-slate-600 hover:border-sky-300 hover:bg-sky-50">
                  {item}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Website editor</h2>
                <p className="text-sm text-slate-500">{document ? document.title : "Generate a deck, then edit slide text and layouts here."}</p>
              </div>
              <button type="button" onClick={onExportEdited} disabled={!document || exporting} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {exporting ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                Export edited
              </button>
            </div>

            {document ? (
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <nav className="max-h-[620px] space-y-2 overflow-auto pr-1">
                  {document.sections.map((section, index) => (
                    <button key={section.id} type="button" onClick={() => setSelectedSection(index)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selectedSection === index ? "border-sky-500 bg-sky-50 text-sky-950" : "border-slate-200 hover:bg-slate-50"}`}>
                      <span className="block text-xs font-semibold text-slate-400">Slide {index + 1}</span>
                      <span className="line-clamp-2 font-medium">{section.title}</span>
                    </button>
                  ))}
                </nav>

                {activeSection ? (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase text-slate-500">Deck title</span>
                      <input className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={document.title} onChange={(event) => updateDocument((draft) => ({ ...draft, title: event.target.value }))} />
                    </label>
                    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase text-slate-500">Slide title</span>
                        <input className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={activeSection.title} onChange={(event) => updateSection(selectedSection, (section) => ({ ...section, title: event.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase text-slate-500">Layout</span>
                        <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-500" value={activeSection.layout || layoutOptions[0]} onChange={(event) => updateSection(selectedSection, (section) => ({ ...section, layout: event.target.value }))}>
                          {layoutOptions.map((layout) => <option key={layout} value={layout}>{labelize(layout)}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase text-slate-500">Bullets</span>
                      <textarea className="mt-1 min-h-40 w-full resize-y rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-sky-500" value={selectedBullets.join("\n")} onChange={(event) => updateSection(selectedSection, (section) => setBullets(section, event.target.value.split("\n").filter(Boolean)))} />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase text-slate-500">Speaker notes</span>
                      <textarea className="mt-1 min-h-28 w-full resize-y rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-sky-500" value={activeSection.speaker_notes || ""} onChange={(event) => updateSection(selectedSection, (section) => ({ ...section, speaker_notes: event.target.value }))} />
                    </label>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid min-h-96 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center">
                <div className="max-w-sm px-6">
                  <FileText className="mx-auto mb-3 text-slate-400" size={42} />
                  <p className="font-semibold">No deck yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Generate once, edit slide-by-slide, then export the edited PPTX.</p>
                </div>
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Download size={18} className="text-sky-700" />
              <h2 className="font-semibold">Downloads</h2>
            </div>
            <div className="space-y-2">
              {(exports.length ? exports : [{ format: "pptx", status: "waiting" }, { format: "docx", status: "waiting" }, { format: "pdf", status: "waiting" }]).map((item) => (
                item.url ? (
                  <a key={item.format} href={fileUrl(item.url)} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold hover:border-sky-300 hover:bg-sky-50">
                    <span className="uppercase">{item.format}</span>
                    <Download size={16} />
                  </a>
                ) : (
                  <div key={item.format} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-400">
                    <span className="font-semibold uppercase">{item.format}</span>
                    <span>{item.status}</span>
                  </div>
                )
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-sky-700" />
              <h2 className="font-semibold">Status</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="capitalize">{user.plan} plan</span>
                  <span>{user.monthly_used}/{user.monthly_limit}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-600" style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
              <p>{result?.quality_checks.find((item) => item.name === "local_ai")?.message ?? "Local AI status appears after generation."}</p>
            </div>
          </section>
        </aside>
      </section>

      {optionsOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/30" onClick={() => setOptionsOpen(false)}>
          <aside className="ml-auto h-full w-full max-w-md overflow-auto bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Menu size={18} className="text-sky-700" />
                <h2 className="font-semibold">Generation options</h2>
              </div>
              <button type="button" onClick={() => setOptionsOpen(false)} className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 hover:bg-slate-50">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">Slides</span>
                <input type="number" min={6} max={24} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" value={options.slides} onChange={(event) => setOptions({ ...options, slides: Number(event.target.value) })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">Design style</span>
                <select className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" value={options.designStyle} onChange={(event) => setOptions({ ...options, designStyle: event.target.value })}>
                  {designStyles.map((style) => <option key={style}>{style}</option>)}
                </select>
              </label>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <LayoutGrid size={15} /> Layouts
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {layoutOptions.map((layout) => (
                    <span key={layout} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-600">{labelize(layout)}</span>
                  ))}
                </div>
              </div>
              <Toggle label="Charts" checked={options.charts} onChange={(checked) => setOptions({ ...options, charts: checked })} />
              <Toggle label="Speaker notes" checked={options.speakerNotes} onChange={(checked) => setOptions({ ...options, speakerNotes: checked })} />
              <Toggle label="References" checked={options.citations} onChange={(checked) => setOptions({ ...options, citations: checked })} />
              <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900">
                <div className="mb-2 flex items-center gap-2 font-semibold"><Palette size={16} /> Deck design</div>
                <p>Each generation rotates through seven editable slide layouts, and every slide can be reassigned before export.</p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-sky-700" />
    </label>
  );
}

function findBullets(section?: DeckSection) {
  const block = section?.content_blocks.find((item) => item.type === "bullets");
  return block?.type === "bullets" ? block.items : [];
}

function setBullets(section: DeckSection, items: string[]) {
  const next = { ...section, content_blocks: [...section.content_blocks] };
  const index = next.content_blocks.findIndex((item) => item.type === "bullets");
  if (index >= 0) {
    next.content_blocks[index] = { type: "bullets", items };
  } else {
    next.content_blocks.unshift({ type: "bullets", items });
  }
  return next;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
