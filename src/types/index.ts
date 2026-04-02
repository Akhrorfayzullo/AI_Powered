// ─── Profile ────────────────────────────────────────────────────────────────

export interface ProfileCategory {
  [question: string]: string; // question → answer
}

export interface ProfileCategories {
  intro: ProfileCategory;
  education: ProfileCategory;
  faith: ProfileCategory;
  family: ProfileCategory;
  character: ProfileCategory;
  goals: ProfileCategory;
  marriage: ProfileCategory;
  lifestyle: ProfileCategory;
  dealbreakers: ProfileCategory;
}

export interface Profile {
  user_id: string;
  name: string;
  slug: string; // unique shareable ID
  categories: ProfileCategories;
  voice_transcripts: string[];
  full_system_prompt: string;
  created_at: string;
  updated_at: string;
}

// ─── Agent Session ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AgentSession {
  id: string;
  profile_owner_id: string;
  visitor_name?: string;
  messages: ChatMessage[];
  created_at: string;
}

// ─── Pending Question ────────────────────────────────────────────────────────

export type QuestionStatus = "pending" | "answered";

export interface PendingQuestion {
  id: string;
  session_id: string;
  profile_owner_id: string;
  question_text: string;
  answer_text: string | null;
  status: QuestionStatus;
  created_at: string;
  answered_at: string | null;
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_question"
  | "session_started"
  | "answer_delivered";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  read: boolean;
  created_at: string;
}
