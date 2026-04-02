"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PendingQuestion {
  id: string;
  question_text: string;
  answer_text: string | null;
  status: "pending" | "answered";
  created_at: string;
}

interface AnswerInputState {
  text: string;
  saving: boolean;
}

interface NotificationInboxProps {
  userId: string;
  profileId: string;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

const C = {
  bg: "#0f1119",
  card: "#1e2235",
  border: "#2e3250",
  gold: "#c8a96e",
  goldFaint: "#c8a96e12",
  green: "#5dca7a",
  greenFaint: "#5dca7a12",
  red: "#e07070",
  text: "#f0ece8",
  textMuted: "#8a8698",
  textDim: "#3a3650",
} as const;

// ─── Bell SVG ────────────────────────────────────────────────────────────────

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationInbox({ userId, profileId }: NotificationInboxProps) {
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [inputState, setInputState] = useState<Record<string, AnswerInputState>>({});
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastQuestionsKeyRef = useRef<string>("");
  const lastUnreadRef = useRef<number>(-1);

  // ── Fetch pending questions (main list) ──────────────────────────────────

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pending_questions")
      .select("id, question_text, answer_text, status, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) console.error("[NotificationInbox] fetch questions error:", error.message);
    setQuestions((data as PendingQuestion[]) ?? []);
    setLoading(false);
  }, [profileId]);

  // ── Fetch unread notification count (badge only) ─────────────────────────

  const loadUnreadCount = useCallback(async () => {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) console.error("[NotificationInbox] fetch unread count error:", error.message);
    setUnreadCount(count ?? 0);
  }, [userId]);

  useEffect(() => {
    loadQuestions();
    loadUnreadCount();
  }, [loadQuestions, loadUnreadCount]);

  // ── Real-time: new pending questions ─────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`pending_questions:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pending_questions",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          const newQ = payload.new as PendingQuestion;
          setQuestions((prev) => [newQ, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe((status) => {
        console.log("[NotificationInbox] realtime status:", status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  // ── Polling: questions — only when panel is open, skip if data unchanged ──

  useEffect(() => {
    if (!open) return;
    const id = setInterval(async () => {
      const { data, error } = await supabase
        .from("pending_questions")
        .select("id, question_text, answer_text, status, created_at")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) return;
      const rows = (data as PendingQuestion[]) ?? [];
      const key = rows.map((q) => `${q.id}:${q.status}`).join(",");
      if (key === lastQuestionsKeyRef.current) return;
      lastQuestionsKeyRef.current = key;
      setQuestions(rows);
    }, 5000);
    return () => clearInterval(id);
  }, [open, profileId]);

  // ── Polling: unread count — always active, skip if unchanged ─────────────

  useEffect(() => {
    const id = setInterval(async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) return;
      const next = count ?? 0;
      if (next === lastUnreadRef.current) return;
      lastUnreadRef.current = next;
      setUnreadCount(next);
    }, 5000);
    return () => clearInterval(id);
  }, [userId]);

  // ── Close on outside click ───────────────────────────────────────────────

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // ── Mark all notifications read when inbox is opened ────────────────────

  const handleOpen = useCallback(async () => {
    setOpen((v) => {
      if (!v && unreadCount > 0) {
        supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("read", false)
          .then(() => setUnreadCount(0));
      }
      return !v;
    });
  }, [userId, unreadCount]);

  // ── Submit answer ────────────────────────────────────────────────────────

  const submitAnswer = useCallback(async (q: PendingQuestion) => {
    const answerText = inputState[q.id]?.text?.trim();
    if (!answerText) return;

    setInputState((prev) => ({
      ...prev,
      [q.id]: { ...prev[q.id], saving: true },
    }));

    // 1. Update pending_question → answered
    const { error: pqError } = await supabase
      .from("pending_questions")
      .update({ answer_text: answerText, status: "answered", answered_at: new Date().toISOString() })
      .eq("id", q.id);

    if (pqError) {
      console.error("[NotificationInbox] update failed:", pqError.message);
      setInputState((prev) => ({ ...prev, [q.id]: { ...prev[q.id], saving: false } }));
      return;
    }

    // 2. Rebuild + save system prompt
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, categories")
      .eq("id", profileId)
      .single();

    if (profile) {
      const { data: allAnswered } = await supabase
        .from("pending_questions")
        .select("question_text, answer_text")
        .eq("profile_id", profileId)
        .eq("status", "answered");

      const newPrompt = buildSystemPrompt(
        profile.name,
        (profile.categories as Record<string, Record<string, string>>) ?? {},
        (allAnswered ?? []) as { question_text: string; answer_text: string }[]
      );

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_system_prompt: newPrompt })
        .eq("id", profileId);

      if (profileError) {
        console.error("[NotificationInbox] prompt save failed:", profileError.message);
      } else {
        console.log("[NotificationInbox] system prompt saved ✓");
      }
    }

    // 3. Update local state immediately
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === q.id ? { ...item, status: "answered", answer_text: answerText } : item
      )
    );
    setInputState((prev) => ({ ...prev, [q.id]: { text: answerText, saving: false } }));
  }, [inputState, profileId]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const pendingCount = questions.filter((q) => q.status === "pending").length;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: open ? C.card : "transparent",
          border: `1px solid ${open ? C.border : "transparent"}`,
          color: unreadCount > 0 ? C.gold : C.textMuted,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: C.red,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: 520,
            overflowY: "auto",
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${C.border}`,
              position: "sticky",
              top: 0,
              backgroundColor: C.card,
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              Questions for You
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  backgroundColor: C.bg,
                  padding: "2px 8px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                {pendingCount} unanswered
              </span>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>Loading…</span>
            </div>
          ) : questions.length === 0 ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 28 }}>🔔</span>
              <span style={{ fontSize: 13, color: C.textMuted }}>No questions yet</span>
              <span style={{ fontSize: 12, color: C.textDim }}>
                You&apos;ll be notified when your Wakeel can&apos;t answer a question.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {questions.map((q) => {
                const state = inputState[q.id];
                const isAnswered = q.status === "answered";

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${C.border}`,
                      backgroundColor: isAnswered ? "transparent" : C.goldFaint,
                      transition: "background-color 0.3s",
                    }}
                  >
                    {/* Question row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: isAnswered ? 0 : 10 }}>
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>❓</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 4px" }}>
                          Someone asked your Wakeel:
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: isAnswered ? C.textMuted : C.text,
                            margin: 0,
                            lineHeight: 1.5,
                            fontStyle: "italic",
                          }}
                        >
                          &ldquo;{q.question_text}&rdquo;
                        </p>
                        {!isAnswered && (
                          <p style={{ fontSize: 11, color: C.red, margin: "4px 0 0" }}>
                            Your Wakeel couldn&apos;t answer this.
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: C.textDim, margin: "4px 0 0" }}>
                          {new Date(q.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Answer area */}
                    {isAnswered ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          borderRadius: 8,
                          backgroundColor: C.greenFaint,
                          border: `1px solid ${C.green}30`,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>✓</span>
                        <span style={{ fontSize: 12, color: C.green, fontWeight: 500 }}>
                          Answered — your Wakeel will now know this.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="text"
                          placeholder="Type your answer…"
                          value={state?.text ?? ""}
                          onChange={(e) =>
                            setInputState((prev) => ({
                              ...prev,
                              [q.id]: { text: e.target.value, saving: false },
                            }))
                          }
                          onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(q); }}
                          disabled={state?.saving}
                          style={{
                            flex: 1,
                            backgroundColor: C.bg,
                            color: C.text,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "7px 12px",
                            fontSize: 12,
                            outline: "none",
                            fontFamily: "inherit",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = C.gold)}
                          onBlur={(e) => (e.target.style.borderColor = C.border)}
                        />
                        <button
                          onClick={() => submitAnswer(q)}
                          disabled={!state?.text?.trim() || state?.saving}
                          style={{
                            flexShrink: 0,
                            padding: "7px 12px",
                            borderRadius: 8,
                            backgroundColor: C.gold,
                            color: C.bg,
                            border: "none",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: !state?.text?.trim() || state?.saving ? 0.45 : 1,
                          }}
                        >
                          {state?.saving ? "…" : "Answer"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
