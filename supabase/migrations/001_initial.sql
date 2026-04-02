-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table public.profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  categories      jsonb not null default '{}',
  voice_transcripts text[] not null default '{}',
  full_system_prompt text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.agent_sessions (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  visitor_name    text,
  messages        jsonb not null default '[]',
  created_at      timestamptz not null default now()
);

create table public.pending_questions (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid not null references public.agent_sessions (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  question_text   text not null,
  answer_text     text,
  status          text not null default 'pending' check (status in ('pending', 'answered')),
  created_at      timestamptz not null default now(),
  answered_at     timestamptz
);

create table public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  type            text not null check (type in ('new_question', 'session_started', 'answer_delivered')),
  content         text not null,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.agent_sessions   enable row level security;
alter table public.pending_questions enable row level security;
alter table public.notifications    enable row level security;

-- profiles: anyone can read (needed for agent chat page), only owner can write
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

create policy "profiles_owner_insert"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "profiles_owner_delete"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- agent_sessions: anyone can start a session, profile owner can read all sessions on their profile
create policy "sessions_public_insert"
  on public.agent_sessions for insert
  with check (true);

create policy "sessions_owner_read"
  on public.agent_sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = agent_sessions.profile_id
        and p.user_id = auth.uid()
    )
  );

-- pending_questions: anyone can insert (visitor asking a question), owner can read + update (answer)
create policy "questions_public_insert"
  on public.pending_questions for insert
  with check (true);

create policy "questions_owner_read"
  on public.pending_questions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = pending_questions.profile_id
        and p.user_id = auth.uid()
    )
  );

create policy "questions_owner_update"
  on public.pending_questions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = pending_questions.profile_id
        and p.user_id = auth.uid()
    )
  );

-- notifications: only the owning user can read/update their own notifications
create policy "notifications_owner_read"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_owner_update"
  on public.notifications for update
  using (auth.uid() = user_id);

-- service role (API routes) can insert notifications on behalf of any user
create policy "notifications_service_insert"
  on public.notifications for insert
  with check (true);
