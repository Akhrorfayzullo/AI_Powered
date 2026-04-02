"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";

// ─── Constants ───────────────────────────────────────────────────────────────

const C = {
  bg: "#0f1119",
  card: "#1e2235",
  sidebar: "#161929",
  border: "#2e3250",
  gold: "#c8a96e",
  goldFaint: "#c8a96e18",
  goldBorder: "#c8a96e35",
  green: "#5dca7a",
  greenFaint: "#5dca7a18",
  greenBorder: "#5dca7a35",
  text: "#f0ece8",
  textMuted: "#8a8698",
  textDim: "#3a3650",
  userBubble: "#243050",
} as const;

const CATEGORIES = [
  {
    key: "intro",
    icon: "👤",
    label: "Introduction",
    questions: [
      "What is your full name?",
      "How old are you?",
      "Where are you originally from?",
      "Where do you currently live?",
      "What is your nationality?",
    ],
  },
  {
    key: "education",
    icon: "🎓",
    label: "Education & Career",
    questions: [
      "What is your highest level of education and what did you study?",
      "What do you currently do for work?",
      "What are your career goals for the next 5-10 years?",
      "Are you financially stable? Briefly describe your financial situation.",
    ],
  },
  {
    key: "faith",
    icon: "🌙",
    label: "Faith & Values",
    questions: [
      "How would you describe your level of religious practice?",
      "What role does Islam play in your daily life?",
      "What Islamic values are most important to you in a marriage?",
      "Do you have any preferences regarding madhab or religious approach?",
    ],
  },
  {
    key: "family",
    icon: "🏡",
    label: "Family Background",
    questions: [
      "Tell me about your family — parents, siblings, how close you are?",
      "What is your family's cultural background?",
      "How involved will your family be in your marriage?",
      "What is your relationship like with your parents?",
    ],
  },
  {
    key: "character",
    icon: "✨",
    label: "Character & Personality",
    questions: [
      "How would your close friends describe you in 3 words?",
      "What are your biggest strengths as a person?",
      "What are your weaknesses or areas you're working on?",
      "How do you handle disagreements or conflicts?",
      "Are you more introverted or extroverted?",
    ],
  },
  {
    key: "goals",
    icon: "🎯",
    label: "Life Goals",
    questions: [
      "Where do you see yourself living long-term?",
      "What does a successful life look like to you?",
      "Do you want children? If yes, how many?",
      "What are your biggest dreams or ambitions?",
    ],
  },
  {
    key: "marriage",
    icon: "💍",
    label: "Marriage Expectations",
    questions: [
      "What qualities are you looking for in a spouse?",
      "What are your expectations regarding roles in the household?",
      "How do you feel about your spouse working?",
      "What does a happy marriage look like to you?",
      "Are you open to your spouse continuing education after marriage?",
    ],
  },
  {
    key: "lifestyle",
    icon: "🌿",
    label: "Lifestyle & Habits",
    questions: [
      "What are your hobbies and interests?",
      "Describe your typical day.",
      "Do you have any health conditions to mention?",
      "Do you smoke or have any habits to mention?",
      "How do you spend your free time?",
    ],
  },
  {
    key: "dealbreakers",
    icon: "⛔",
    label: "Dealbreakers",
    questions: [
      "What are your absolute dealbreakers?",
      "What are must-haves in a partner?",
      "Is there anything about yourself that might concern the other side? Be honest.",
      "Anything else you want your AI agent to know?",
    ],
  },
] as const;

const TOTAL_QUESTIONS = CATEGORIES.reduce((s, c) => s + c.questions.length, 0);

// ─── Types ───────────────────────────────────────────────────────────────────

type Answers = Record<string, Record<string, string>>;

interface ProfileBuilderProps {
  profile: {
    user_id: string;
    name: string;
    categories: unknown;
    full_system_prompt: string;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileBuilder({ profile }: ProfileBuilderProps) {
  const [answers, setAnswers] = useState<Answers>(
    (profile.categories as Answers) ?? {}
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [input, setInput] = useState("");
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Responsive detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const category = CATEGORIES[selectedIdx];
  const catAnswers = answers[category.key] ?? {};
  const catDone = category.questions.filter((q) => catAnswers[q]?.trim()).length;
  const totalAnswered = CATEGORIES.reduce(
    (sum, cat) =>
      sum + cat.questions.filter((q) => answers[cat.key]?.[q]?.trim()).length,
    0
  );
  const nextQ = category.questions.find((q) => !catAnswers[q]?.trim()) ?? null;
  const pct = Math.round((totalAnswered / TOTAL_QUESTIONS) * 100);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answers, selectedIdx]);

  useEffect(() => {
    setInput("");
    setEditingQ(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [selectedIdx]);

  // ── Persist ──────────────────────────────────────────────────────────────

  async function persist(newAnswers: Answers) {
    setSaving(true);
    const prompt = buildSystemPrompt(profile.name, newAnswers);
    await supabase
      .from("profiles")
      .update({ categories: newAnswers, full_system_prompt: prompt })
      .eq("user_id", profile.user_id);
    setSaving(false);
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !nextQ) return;
    const newAnswers: Answers = {
      ...answers,
      [category.key]: { ...catAnswers, [nextQ]: trimmed },
    };
    setAnswers(newAnswers);
    setInput("");
    await persist(newAnswers);
  }

  async function saveEdit(question: string) {
    const trimmed = editInput.trim();
    if (!trimmed) return;
    const newAnswers: Answers = {
      ...answers,
      [category.key]: { ...catAnswers, [question]: trimmed },
    };
    setAnswers(newAnswers);
    setEditingQ(null);
    await persist(newAnswers);
  }

  // ── Sidebar item ─────────────────────────────────────────────────────────

  function SidebarItem({ cat, idx }: { cat: typeof CATEGORIES[number]; idx: number }) {
    const done = cat.questions.filter((q) => answers[cat.key]?.[q]?.trim()).length;
    const complete = done === cat.questions.length;
    const active = idx === selectedIdx;
    return (
      <button
        onClick={() => setSelectedIdx(idx)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 16px",
          background: active ? C.card : "transparent",
          borderLeft: `3px solid ${active ? C.gold : "transparent"}`,
          cursor: "pointer",
          transition: "background 0.15s",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0, width: 22, textAlign: "center" }}>
          {cat.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: active ? C.text : C.textMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cat.label}
          </div>
          <div
            style={{
              fontSize: 11,
              marginTop: 2,
              color: complete ? C.green : C.textDim,
              fontWeight: complete ? 600 : 400,
            }}
          >
            {complete ? "✓ Complete" : `${done} / ${cat.questions.length}`}
          </div>
        </div>
      </button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "85vh" : "80vh",
        minHeight: 520,
        maxHeight: 900,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
      }}
    >
      {/* ── Top bar: title + progress ── */}
      <div
        style={{
          flexShrink: 0,
          padding: "14px 20px",
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.card,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            Profile Interview
          </span>
          <span
            style={{
              fontSize: 12,
              color: saving ? C.gold : C.textMuted,
              transition: "color 0.2s",
            }}
          >
            {saving ? "Saving…" : `${totalAnswered} / ${TOTAL_QUESTIONS} answered · ${pct}%`}
          </span>
        </div>
        {/* Progress bar */}
        <div
          style={{
            height: 4,
            borderRadius: 4,
            backgroundColor: C.bg,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 4,
              backgroundColor: C.gold,
              width: `${pct}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* ── Mobile: horizontal category tabs ── */}
      {isMobile && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            overflowX: "auto",
            gap: 6,
            padding: "8px 12px",
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.sidebar,
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat, idx) => {
            const done = cat.questions.filter((q) => answers[cat.key]?.[q]?.trim()).length;
            const complete = done === cat.questions.length;
            const active = idx === selectedIdx;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 20,
                  backgroundColor: active ? C.card : "transparent",
                  border: `1px solid ${active ? C.goldBorder : "transparent"}`,
                  color: active ? C.gold : complete ? C.green : C.textMuted,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <span>{cat.icon}</span>
                {complete && !active ? "✓" : cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Body: sidebar + chat ── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Desktop sidebar */}
        {!isMobile && (
          <aside
            style={{
              width: 250,
              flexShrink: 0,
              overflowY: "auto",
              borderRight: `1px solid ${C.border}`,
              backgroundColor: C.sidebar,
              display: "flex",
              flexDirection: "column",
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            {CATEGORIES.map((cat, idx) => (
              <SidebarItem key={cat.key} cat={cat} idx={idx} />
            ))}
          </aside>
        )}

        {/* Chat pane */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Pane header */}
          <div
            style={{
              flexShrink: 0,
              padding: "10px 20px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>{category.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>
              {category.label}
            </span>
            <span
              style={{
                fontSize: 12,
                color: catDone === category.questions.length ? C.green : C.textMuted,
              }}
            >
              {catDone} / {category.questions.length}
            </span>
          </div>

          {/* Messages scroll area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 20px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {(() => {
              let shownNext = false;
              return category.questions.map((q, qi) => {
                const answer = catAnswers[q]?.trim();
                const isNext = !answer && !shownNext;
                if (!answer && !isNext) return null;
                if (isNext) shownNext = true;

                return (
                  <div key={qi} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* AI question bubble */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div
                        style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: C.goldFaint,
                          border: `1px solid ${C.goldBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: C.gold,
                          marginTop: 2,
                        }}
                      >
                        AI
                      </div>
                      <div
                        style={{
                          backgroundColor: C.bg,
                          color: "#ccc9c2",
                          borderRadius: "4px 16px 16px 16px",
                          padding: "10px 16px",
                          fontSize: 13,
                          lineHeight: 1.6,
                          maxWidth: "78%",
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {q}
                      </div>
                    </div>

                    {/* User answer bubble */}
                    {answer && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {editingQ === q ? (
                          <div style={{ maxWidth: "78%", width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                            <textarea
                              autoFocus
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  saveEdit(q);
                                }
                                if (e.key === "Escape") setEditingQ(null);
                              }}
                              rows={3}
                              style={{
                                width: "100%",
                                backgroundColor: C.bg,
                                color: C.text,
                                border: `1px solid ${C.gold}`,
                                borderRadius: 10,
                                padding: "10px 14px",
                                fontSize: 13,
                                resize: "none",
                                outline: "none",
                                fontFamily: "inherit",
                                lineHeight: 1.6,
                              }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                              <button
                                onClick={() => setEditingQ(null)}
                                style={{
                                  fontSize: 12,
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  color: C.textMuted,
                                  background: "transparent",
                                  border: `1px solid ${C.border}`,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEdit(q)}
                                style={{
                                  fontSize: 12,
                                  padding: "6px 14px",
                                  borderRadius: 8,
                                  backgroundColor: C.gold,
                                  color: C.bg,
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 4,
                              maxWidth: "78%",
                            }}
                          >
                            <div
                              onClick={() => { setEditingQ(q); setEditInput(answer); }}
                              title="Click to edit"
                              style={{
                                backgroundColor: C.userBubble,
                                color: C.text,
                                borderRadius: "16px 4px 16px 16px",
                                padding: "10px 16px",
                                fontSize: 13,
                                lineHeight: 1.6,
                                border: `1px solid ${C.goldBorder}`,
                                cursor: "pointer",
                                wordBreak: "break-word",
                              }}
                            >
                              {answer}
                            </div>
                            <span style={{ fontSize: 10, color: C.textDim }}>
                              tap to edit
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {/* Section complete banner */}
            {!nextQ && (
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "6px 16px",
                    borderRadius: 20,
                    backgroundColor: C.greenFaint,
                    color: C.green,
                    border: `1px solid ${C.greenBorder}`,
                  }}
                >
                  ✓ Section complete
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input area */}
          {nextQ && (
            <form
              onSubmit={submitAnswer}
              style={{
                flexShrink: 0,
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
                padding: "12px 16px",
                borderTop: `1px solid ${C.border}`,
                backgroundColor: C.card,
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitAnswer(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Type your answer…  (Enter to send · Shift+Enter for new line)"
                rows={2}
                style={{
                  flex: 1,
                  backgroundColor: C.bg,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = C.gold)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
              />
              <button
                type="submit"
                disabled={!input.trim() || saving}
                style={{
                  flexShrink: 0,
                  backgroundColor: C.gold,
                  color: C.bg,
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: !input.trim() || saving ? 0.45 : 1,
                  transition: "opacity 0.15s",
                  alignSelf: "flex-end",
                }}
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
