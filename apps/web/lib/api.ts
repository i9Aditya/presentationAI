export type UserProfile = {
  id: string;
  email: string;
  name?: string | null;
  plan: string;
  monthly_limit: number;
  monthly_used: number;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

export type ContentBlock =
  | { type: "text"; role: "heading" | "subtitle" | "paragraph" | "callout"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "chart"; chart_kind: "bar" | "line" | "pie" | "doughnut" | "scatter"; title: string; data: { labels: string[]; values: number[] } }
  | { type: "diagram"; diagram_kind: "mermaid" | "excalidraw" | "uml" | "architecture" | "flowchart"; title: string; source: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export type DeckSection = {
  id: string;
  kind: string;
  title: string;
  layout?: string;
  content_blocks: ContentBlock[];
  speaker_notes?: string;
  citation_ids?: string[];
};

export type DocumentIR = {
  document_id: string;
  type: string;
  audience: string;
  language: string;
  style: string;
  title: string;
  sections: DeckSection[];
  citations: unknown[];
  theme: {
    font_heading: string;
    font_body: string;
    primary: string;
    accent: string;
    background: string;
    foreground: string;
  };
};

export type ExportOption = { format: string; status: string; url?: string };

export type GenerateResponse = {
  job_id: string;
  status: string;
  intent: {
    output_type: string;
    topic: string;
    audience: string;
    length: Record<string, number>;
    requires_research: boolean;
    requires_citations: boolean;
    requires_visuals: boolean;
    visual_types: string[];
    tone: string;
    language: string;
  };
  document: DocumentIR;
  cost: {
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
    selected_models: string[];
    cache_strategy: string[];
  };
  quality_checks: Array<{ name: string; status: string; message: string }>;
  exports: ExportOption[];
};

export function apiBaseUrl() {
  const url = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").trim();
  const cleanUrl = url.replace(/\/+$/, "");
  if (typeof window !== 'undefined') {
    console.log("🔗 Connecting to API at:", cleanUrl);
  }
  return cleanUrl;
}

export function fileUrl(url?: string) {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  const base = apiBaseUrl();
  // The url from the API already contains 'files/'
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body.detail === "string" ? body.detail : `Request failed with ${response.status}`;
    throw new Error(detail);
  }
  return body as T;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl()}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  return readJson<AuthResponse>(response);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return readJson<AuthResponse>(response);
}

export async function googleLogin(profile: { email: string; name?: string; google_id?: string; picture?: string }): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl()}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });
  return readJson<AuthResponse>(response);
}

export async function getMe(token: string): Promise<UserProfile> {
  const response = await fetch(`${apiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return readJson<UserProfile>(response);
}

export async function generateDocument(
  prompt: string,
  token: string,
  options?: { preferred_length?: number; design_style?: string; layout_pack?: string }
): Promise<GenerateResponse> {
  const response = await fetch(`${apiBaseUrl()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt, ...options })
  });
  return readJson<GenerateResponse>(response);
}

export async function exportEditedDocument(document: DocumentIR, token: string): Promise<ExportOption[]> {
  const response = await fetch(`${apiBaseUrl()}/generate/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ document })
  });
  return readJson<ExportOption[]>(response);
}
