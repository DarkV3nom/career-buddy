-- Career Application Assistant — initial schema
-- Hand-written (not `prisma migrate dev` output — the Prisma engine
-- binary download is blocked in the build sandbox; see README note in
-- packages/db). Run this against Supabase via `supabase db push` or the
-- SQL editor, then run `prisma db pull` locally to confirm the schema
-- matches schema.prisma before trusting `prisma migrate` going forward.

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now()
);

create table candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  current_title text,
  years_experience int,
  industry text,
  career_level text,
  target_titles text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Resumes
-- ---------------------------------------------------------------------

create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  source_type text not null check (source_type in ('uploaded', 'built_from_scratch')),
  raw_file_url text,
  parsed_text text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
create index resumes_user_id_idx on resumes(user_id);
-- ANN index for retrieval; ivfflat needs a representative row count to
-- train well, so this is safe to create even with a small seed dataset
-- but should be re-created (or switched to hnsw) once volume grows.
create index resumes_embedding_idx on resumes using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_name text,
  role_title text,
  raw_text text not null,
  extracted_keywords jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
create index job_descriptions_user_id_idx on job_descriptions(user_id);
create index job_descriptions_embedding_idx on job_descriptions using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  job_description_id uuid references job_descriptions(id) on delete set null,
  version_label text not null,
  content_json jsonb not null,
  ats_checklist jsonb,
  created_at timestamptz not null default now()
);
create index resume_versions_resume_id_idx on resume_versions(resume_id);
create index resume_versions_job_description_id_idx on resume_versions(job_description_id);

create table resume_jd_matches (
  id uuid primary key default gen_random_uuid(),
  resume_version_id uuid not null references resume_versions(id) on delete cascade,
  job_description_id uuid not null references job_descriptions(id) on delete cascade,
  match_score numeric(5,2),
  missing_keywords jsonb,
  matched_keywords jsonb,
  created_at timestamptz not null default now()
);
create index resume_jd_matches_resume_version_id_idx on resume_jd_matches(resume_version_id);
create index resume_jd_matches_job_description_id_idx on resume_jd_matches(job_description_id);

-- ---------------------------------------------------------------------
-- Generated artifacts
-- ---------------------------------------------------------------------

create table cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_description_id uuid not null references job_descriptions(id) on delete cascade,
  resume_version_id uuid references resume_versions(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
create index cover_letters_user_id_idx on cover_letters(user_id);

create table star_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  competency_tags text[] not null default '{}',
  situation text not null,
  task text not null,
  action text not null,
  result text not null,
  target_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index star_stories_user_id_idx on star_stories(user_id);

create table interview_prep_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_description_id uuid references job_descriptions(id) on delete set null,
  common_answers jsonb,
  interviewer_questions jsonb,
  created_at timestamptz not null default now()
);
create index interview_prep_packs_user_id_idx on interview_prep_packs(user_id);

-- Implicit Prisma many-to-many join table for StarStory <-> InterviewPrepPack
-- (table/column naming follows Prisma's default convention for implicit m2m
-- so `prisma db pull` reconciles cleanly against schema.prisma).
create table "_PrepPackStories" (
  "A" uuid not null references interview_prep_packs(id) on delete cascade,
  "B" uuid not null references star_stories(id) on delete cascade
);
create unique index "_PrepPackStories_AB_unique" on "_PrepPackStories"("A", "B");
create index "_PrepPackStories_B_index" on "_PrepPackStories"("B");

-- ---------------------------------------------------------------------
-- Conversations, messages, observability
-- ---------------------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text,
  active_resume_version_id uuid references resume_versions(id) on delete set null,
  active_job_description_id uuid references job_descriptions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_id_idx on conversations(user_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  mode text,
  artifact_type text,
  artifact_id uuid,
  guardrail_flags jsonb,
  created_at timestamptz not null default now()
);
create index messages_conversation_id_idx on messages(conversation_id);

create table task_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  message_id uuid not null references messages(id) on delete cascade,
  router_mode text,
  router_confidence numeric(4,3),
  missing_info text[] not null default '{}',
  latency_ms int,
  created_at timestamptz not null default now()
);
create index task_runs_conversation_id_idx on task_runs(conversation_id);
create index task_runs_message_id_idx on task_runs(message_id);

-- ---------------------------------------------------------------------
-- Row-Level Security
-- Every user-scoped table: candidates can only read/write their own rows.
-- Assumes Supabase Auth (auth.uid() available). Tables reached only via a
-- parent FK (resume_versions, resume_jd_matches, task_runs, the m2m join
-- table) enforce ownership by joining up to the owning row rather than
-- duplicating user_id on every table.
-- ---------------------------------------------------------------------

alter table users enable row level security;
create policy users_self on users
  for all using (id = auth.uid()) with check (id = auth.uid());

alter table candidate_profiles enable row level security;
create policy candidate_profiles_owner on candidate_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table resumes enable row level security;
create policy resumes_owner on resumes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table job_descriptions enable row level security;
create policy job_descriptions_owner on job_descriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table resume_versions enable row level security;
create policy resume_versions_owner on resume_versions
  for all using (
    exists (select 1 from resumes r where r.id = resume_versions.resume_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from resumes r where r.id = resume_versions.resume_id and r.user_id = auth.uid())
  );

alter table resume_jd_matches enable row level security;
create policy resume_jd_matches_owner on resume_jd_matches
  for all using (
    exists (
      select 1 from resume_versions rv
      join resumes r on r.id = rv.resume_id
      where rv.id = resume_jd_matches.resume_version_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from resume_versions rv
      join resumes r on r.id = rv.resume_id
      where rv.id = resume_jd_matches.resume_version_id and r.user_id = auth.uid()
    )
  );

alter table cover_letters enable row level security;
create policy cover_letters_owner on cover_letters
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table star_stories enable row level security;
create policy star_stories_owner on star_stories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table interview_prep_packs enable row level security;
create policy interview_prep_packs_owner on interview_prep_packs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table conversations enable row level security;
create policy conversations_owner on conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table messages enable row level security;
create policy messages_owner on messages
  for all using (
    exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from conversations c where c.id = messages.conversation_id and c.user_id = auth.uid())
  );

alter table task_runs enable row level security;
create policy task_runs_owner on task_runs
  for all using (
    exists (select 1 from conversations c where c.id = task_runs.conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from conversations c where c.id = task_runs.conversation_id and c.user_id = auth.uid())
  );

alter table "_PrepPackStories" enable row level security;
create policy prep_pack_stories_owner on "_PrepPackStories"
  for all using (
    exists (select 1 from interview_prep_packs p where p.id = "_PrepPackStories"."A" and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from interview_prep_packs p where p.id = "_PrepPackStories"."A" and p.user_id = auth.uid())
  );
