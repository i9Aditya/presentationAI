"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Crown,
  Download,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  MailWarning,
  Palette,
  Presentation,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Workflow,
  Zap
} from "lucide-react";
import { fileUrl, generateDocument, GenerateResponse, getMe, login, signup, UserProfile } from "@/lib/api";

const samplePrompt =
  "Create a 12-slide PPT on Intrusion Detection Systems using the CICIDS2017 dataset with charts, architecture diagrams, and speaker notes.";

const quickPrompts = [
  "Create an editable 10-slide PPT on AI in healthcare for engineering students with charts and speaker notes.",
  "Create a 12-slide MBA pitch deck for a campus food delivery startup with market size and financial slides.",
  "Generate a project report on smart attendance system with abstract, methodology, results, and references."
];

const plans = [
  { name: "Free", price: "₹0", limit: "5 generations/month", detail: "Watermark-ready starter plan" },
  { name: "Pro", price: "₹499", limit: "100 generations/month", detail: "Students, founders and professionals" },
  { name: "Business", price: "₹1,999", limit: "500 generations/month", detail: "Teams, colleges and agencies" }
];

export function PromptStudio() {
  const [prompt, setPrompt] = useState(samplePrompt);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

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
  const ollamaStatus = useMemo(() => {
    const check = result?.quality_checks.find((item) => item.name === "local_ai" || item.name === "ai_status");
    return check?.message ?? "Ollama will be used automatically when it is running.";
  }, [result]);

  async function onAuthSubmit(event: FormEvent) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = authMode === "signup"
        ? await signup(form.name, form.email, form.password)
        : await login(form.email, form.password);
      setToken(response.token);
      setUser(response.user);
      window.localStorage.setItem("presentationai_token", response.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Please sign in before generating documents.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await generateDocument(prompt, token));
      setUser(await getMe(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("presentationai_token");
    setToken(null);
    setUser(null);
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-15%] h-[460px] w-[460px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute right-[-12%] top-[20%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-16%] left-[30%] h-[380px] w-[520px] rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#070b14] shadow-sm">
              <WandSparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Startup-ready AI document SaaS</p>
              <h1 className="text-lg font-semibold">PresentationAI</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TopBadge icon={<Presentation size={14} />} label="PptxGenJS" />
            <TopBadge icon={<ShieldCheck size={14} />} label="Login protected" />
            {user ? (
              <button onClick={logout} className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-slate-200 hover:bg-white/10">
                <LogOut size={15} /> Logout
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 px-5 py-5 xl:grid-cols-[360px_1fr_330px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="font-semibold">Account access</h2>
                <p className="text-sm text-slate-400">Required before generation.</p>
              </div>
            </div>

            {user ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize">{user.plan} plan</span>
                    <span>{user.monthly_used}/{user.monthly_limit}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${usagePercent}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onAuthSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 rounded-md bg-black/20 p-1 text-sm">
                  <button type="button" onClick={() => setAuthMode("signup")} className={`rounded px-3 py-2 font-medium ${authMode === "signup" ? "bg-white text-[#070b14]" : "text-slate-400"}`}>Sign up</button>
                  <button type="button" onClick={() => setAuthMode("login")} className={`rounded px-3 py-2 font-medium ${authMode === "login" ? "bg-white text-[#070b14]" : "text-slate-400"}`}>Login</button>
                </div>
                {authMode === "signup" ? (
                  <input className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                ) : null}
                <input className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" placeholder="Work or personal email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                <input className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" placeholder="Password, min 8 chars" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-[#07111f] hover:bg-cyan-200 disabled:opacity-60" disabled={authLoading}>
                  {authLoading ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
                  {authMode === "signup" ? "Create account" : "Login"}
                </button>
                {authError ? <p className="rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{authError}</p> : null}
                <div className="flex gap-2 rounded-md border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                  <MailWarning size={16} className="mt-0.5 shrink-0" /> Temporary email domains are blocked at signup.
                </div>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <RefreshCcw size={17} className="text-cyan-300" />
              <h2 className="font-semibold">Prompt starters</h2>
            </div>
            <div className="space-y-2">
              {quickPrompts.map((item) => (
                <button key={item} type="button" onClick={() => setPrompt(item)} className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left text-sm leading-5 text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <Crown size={17} className="text-cyan-300" />
              <h2 className="font-semibold">Subscriptions</h2>
            </div>
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm font-semibold text-cyan-200">{plan.price}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{plan.limit}</p>
                  <p className="mt-1 text-xs text-slate-500">{plan.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <form onSubmit={onSubmit} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur">
            <div className="border-b border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                    <Sparkles size={14} /> Dark SaaS studio
                  </div>
                  <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-white">Generate beautiful editable presentations behind a paid-access gate.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Login prevents misuse, monthly quotas control usage, and disposable emails are blocked before account creation.</p>
                </div>
                <div className="grid min-w-40 gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  <span className="text-slate-400">Current access</span>
                  <span className="font-semibold capitalize">{user ? `${user.plan} plan` : "Locked"}</span>
                </div>
              </div>
            </div>
            <div className="p-5">
              <textarea className="min-h-48 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-400">
                  <span className="rounded-md bg-white/10 px-2.5 py-1">Cards</span>
                  <span className="rounded-md bg-white/10 px-2.5 py-1">Charts</span>
                  <span className="rounded-md bg-white/10 px-2.5 py-1">Diagrams</span>
                  <span className="rounded-md bg-white/10 px-2.5 py-1">Speaker notes</span>
                </div>
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-[#07111f] shadow-sm transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300" disabled={loading || !user} type="submit">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  {!user ? "Login to generate" : loading ? "Designing deck..." : "Generate designed deck"}
                </button>
              </div>
              {error ? <p className="mt-3 rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
            </div>
          </form>

          <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers3 className="text-cyan-300" size={19} />
                <h2 className="font-semibold">Deck structure preview</h2>
              </div>
              {result ? <span className="rounded-md bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">{result.status}</span> : null}
            </div>
            {result ? (
              <div className="grid gap-3 md:grid-cols-2">
                {result.document.sections.map((section, index) => (
                  <article key={section.id} className="group overflow-hidden rounded-lg border border-white/10 bg-black/20 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-cyan-300 text-xs font-semibold text-[#07111f]">{String(index + 1).padStart(2, "0")}</div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{section.title}</h3>
                        <p className="text-xs text-slate-500">{section.layout ?? "designed layout"}</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-400">{section.speaker_notes}</p>
                      <div className="mt-3 grid grid-cols-4 gap-1">
                        <div className="h-1.5 rounded bg-cyan-300" />
                        <div className="h-1.5 rounded bg-orange-400" />
                        <div className="h-1.5 rounded bg-emerald-400" />
                        <div className="h-1.5 rounded bg-white/20" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-white/15 bg-black/20 text-center">
                <div className="max-w-sm px-6">
                  <FileText className="mx-auto mb-3 text-slate-500" size={42} />
                  <p className="font-semibold text-slate-200">Your designed deck preview appears here.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Sign in and generate a deck to unlock exports.</p>
                </div>
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-4">
          <Panel icon={<Download size={17} />} title="Export package">
            <div className="space-y-2">
              {(result?.exports ?? [{ format: "pptx", status: "locked" }, { format: "docx", status: "locked" }, { format: "pdf", status: "locked" }]).map((item) => (
                item.url ? (
                  <a key={item.format} href={fileUrl(item.url)} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-3 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
                    <span className="text-sm font-semibold uppercase">{item.format}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-200">Download <Download size={14} /></span>
                  </a>
                ) : (
                  <div key={item.format} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-slate-500">
                    <span className="text-sm font-semibold uppercase">{item.format}</span>
                    <span className="text-sm">{item.status}</span>
                  </div>
                )
              ))}
            </div>
          </Panel>

          <Panel icon={<Gauge size={17} />} title="Local runtime">
            <div className="space-y-3 text-sm leading-6 text-slate-400">
              <p>{ollamaStatus}</p>
              {result ? <MiniMetric label="AI cost" value={`$${result.cost.estimated_cost_usd.toFixed(2)}`} /> : null}
            </div>
          </Panel>

          <Panel icon={<CheckCircle2 size={17} />} title="Quality checks">
            <div className="space-y-2">
              {(result?.quality_checks ?? []).map((check) => (
                <div key={check.name} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium capitalize text-slate-200">{check.name.replaceAll("_", " ")}</span>
                    <span className={check.status === "passed" ? "text-emerald-300" : "text-orange-300"}>{check.status}</span>
                  </div>
                  <p className="mt-1 leading-5 text-slate-500">{check.message}</p>
                </div>
              ))}
              {!result ? <p className="text-sm leading-6 text-slate-500">Checks run after generation.</p> : null}
            </div>
          </Panel>

          <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-50 shadow-sm">
            <div className="flex items-center gap-2">
              <Boxes size={18} className="text-cyan-200" />
              <h2 className="font-semibold">Startup controls</h2>
            </div>
            <div className="mt-4 grid gap-2 text-xs font-medium text-cyan-100">
              <span className="rounded-md bg-black/20 px-2 py-2">Login required</span>
              <span className="rounded-md bg-black/20 px-2 py-2">Temp email blocked</span>
              <span className="rounded-md bg-black/20 px-2 py-2">Monthly quotas</span>
              <span className="rounded-md bg-black/20 px-2 py-2">Subscription-ready</span>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function TopBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 md:inline-flex">{icon}{label}</span>;
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-slate-100">
        <span className="text-cyan-300">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
