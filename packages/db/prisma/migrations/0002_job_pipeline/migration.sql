-- One-click-apply job pipeline: adds scraping metadata + status tracking
-- to job_descriptions, plus outreach_messages for Section 6.9-style
-- generated emails/messages. Hand-written for the same reason as
-- 0001_init -- see packages/db/README.md.

create type "JobSource" as enum ('MANUAL', 'LINKEDIN', 'INDEED', 'HIRINGCAFE');
create type "JobStatus" as enum ('AVAILABLE_TO_APPLY', 'TO_BE_APPLIED', 'APPLIED', 'IN_PROGRESS', 'REJECTED', 'NO_ANSWER');

alter table job_descriptions
  add column source varchar(255) not null default 'MANUAL',
  add column external_id text,
  add column external_url text,
  add column location text,
  add column workplace_type text,
  add column salary_text text,
  add column experience_level text,
  add column posted_at timestamptz,
  add column scraped_at timestamptz,
  add column status varchar(255) not null default 'AVAILABLE_TO_APPLY',
  add column notes text,
  add column updated_at timestamptz not null default now();

-- Convert the plain-text columns to the enum types now that every existing
-- row has a valid default value (can't add an enum column with a default
-- in one step across all Postgres versions cleanly, so this two-step
-- avoids a migration that fails on a non-empty table).
alter table job_descriptions
  alter column source type "JobSource" using source::"JobSource",
  alter column status type "JobStatus" using status::"JobStatus";

create unique index job_descriptions_external_url_key on job_descriptions(external_url) where external_url is not null;
create index job_descriptions_user_id_status_idx on job_descriptions(user_id, status);
create index job_descriptions_source_idx on job_descriptions(source);

create table outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_description_id uuid not null references job_descriptions(id) on delete cascade,
  message_type text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index outreach_messages_user_id_idx on outreach_messages(user_id);

alter table outreach_messages enable row level security;
create policy outreach_messages_owner on outreach_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
