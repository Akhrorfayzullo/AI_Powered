-- ── Bug 1 fix: enable real-time broadcast for the notifications table ──────────
-- Run this in the Supabase SQL editor if not using the CLI migration runner.
alter publication supabase_realtime add table public.notifications;

-- ── Bug 2 fix: allow the anon (chat API) key to read answered pending_questions ─
-- Answered Q&As are intentionally public — they are fed back into the AI Wakeel
-- which is a public-facing agent. Only answered rows are exposed.
create policy "questions_answered_public_read"
  on public.pending_questions for select
  using (status = 'answered');
