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
  document: {
    document_id: string;
    type: string;
    title: string;
    sections: Array<{
      id: string;
      kind: string;
      title: string;
      layout?: string;
      content_blocks: Array<Record<string, unknown>>;
      speaker_notes?: string;
    }>;
  };
  cost: {
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
    selected_models: string[];
    cache_strategy: string[];
  };
  quality_checks: Array<{ name: string; status: string; message: string }>;
  exports: Array<{ format: string; status: string; url?: string }>;
};

export function apiBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function fileUrl(url?: string) {
  if (!url) return "#";
  if (url.startsWith("http")) return url;
  return `${apiBaseUrl()}${url}`;
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

export async function getMe(token: string): Promise<UserProfile> {
  const response = await fetch(`${apiBaseUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return readJson<UserProfile>(response);
}

export async function generateDocument(prompt: string, token: string): Promise<GenerateResponse> {
  const response = await fetch(`${apiBaseUrl()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt })
  });
  return readJson<GenerateResponse>(response);
}
