create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  role text not null default 'user',
  auth_provider text,
  created_at timestamptz not null default now()
);

create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references users(id),
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  type text not null,
  status text not null default 'draft',
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null,
  title text not null,
  current_version_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table document_versions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  version_number int not null,
  ir_json jsonb not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

alter table documents
  add constraint documents_current_version_fk
  foreign key (current_version_id) references document_versions(id);

create table templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  output_type text not null,
  theme_json jsonb not null,
  layout_json jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  asset_type text not null,
  storage_url text not null,
  checksum text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table generation_jobs (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete set null,
  user_id uuid references users(id),
  status text not null default 'queued',
  prompt text not null,
  intent_json jsonb not null default '{}',
  cost_estimate_usd numeric(12, 6) not null default 0,
  actual_cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table ai_generation_steps (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  step_name text not null,
  model_provider text not null,
  model_name text not null,
  input_hash text not null,
  prompt_template_version text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  cache_hit boolean not null default false,
  status text not null default 'completed',
  error text,
  created_at timestamptz not null default now()
);

create table citations (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  title text not null,
  authors jsonb not null default '[]',
  year int,
  source_url text,
  doi text,
  citation_style text not null default 'IEEE',
  formatted_text text not null,
  reliability_score numeric(4, 3) not null default 0.5
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id),
  target_path text not null,
  body text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table exports (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  version_id uuid not null references document_versions(id) on delete cascade,
  format text not null,
  storage_url text,
  status text not null default 'queued',
  checksum text,
  created_at timestamptz not null default now()
);

create table usage_events (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references users(id),
  event_type text not null,
  units int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  plan text not null,
  status text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  renews_at timestamptz
);

create table document_chunks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  source_type text not null,
  source_url text,
  text text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_projects_workspace on projects(workspace_id);
create index idx_documents_project on documents(project_id);
create index idx_generation_jobs_status on generation_jobs(status);
create index idx_ai_generation_steps_job on ai_generation_steps(job_id);
create index idx_usage_events_workspace_created on usage_events(workspace_id, created_at);
create index idx_document_chunks_workspace on document_chunks(workspace_id);
create index idx_assets_checksum on assets(checksum);
create index idx_documents_metadata on documents using gin(metadata);

