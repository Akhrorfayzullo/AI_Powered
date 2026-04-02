import { createBrowserClient } from "@supabase/ssr";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          categories: Json;
          voice_transcripts: string[];
          full_system_prompt: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          categories?: Json;
          voice_transcripts?: string[];
          full_system_prompt?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          categories?: Json;
          voice_transcripts?: string[];
          full_system_prompt?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_sessions: {
        Row: {
          id: string;
          profile_id: string;
          visitor_name: string | null;
          messages: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          visitor_name?: string | null;
          messages?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          visitor_name?: string | null;
          messages?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_sessions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pending_questions: {
        Row: {
          id: string;
          session_id: string;
          profile_id: string;
          question_text: string;
          answer_text: string | null;
          status: "pending" | "answered";
          created_at: string;
          answered_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          profile_id: string;
          question_text: string;
          answer_text?: string | null;
          status?: "pending" | "answered";
          created_at?: string;
          answered_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          profile_id?: string;
          question_text?: string;
          answer_text?: string | null;
          status?: "pending" | "answered";
          created_at?: string;
          answered_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pending_questions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pending_questions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "agent_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "new_question" | "session_started" | "answer_delivered";
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "new_question" | "session_started" | "answer_delivered";
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "new_question" | "session_started" | "answer_delivered";
          content?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
