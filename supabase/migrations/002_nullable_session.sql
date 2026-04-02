-- Allow pending_questions to be created without an agent_session
-- (used when the AI flags an unanswered question mid-chat, before full session tracking is built)
ALTER TABLE public.pending_questions
  ALTER COLUMN session_id DROP NOT NULL;
