-- Link notifications directly to the pending_question they were created for.
-- This lets the inbox check live status (pending vs answered) on every load
-- without fuzzy question_text matching.
alter table public.notifications
  add column pending_question_id uuid
    references public.pending_questions (id)
    on delete set null;
