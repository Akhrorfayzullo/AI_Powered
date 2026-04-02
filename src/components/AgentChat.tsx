"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

interface AgentChatProps {
  slug: string;
  profileName: string;
  profileId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const C = {
  bg: "#0f1119",
  card: "#1e2235",
  border: "#2e3250",
  gold: "#c8a96e",
  goldFaint: "#c8a96e15",
  goldBorder: "#c8a96e30",
  green: "#5dca7a",
  text: "#f0ece8",
  textMuted: "#8a8698",
  userBubble: "#243050",
  userBorder: "#3a4d7a",
} as const;

// ─── Thinking indicator ───────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: C.textMuted,
            animation: `nikah-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes nikah-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function WakilAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: C.goldFaint,
        border: `1.5px solid ${C.goldBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        color: C.gold,
        flexShrink: 0,
      }}
    >
      W
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AgentChat({ slug, profileName, profileId }: AgentChatProps) {
  const greeting = `Assalamu Alaikum! I am the AI Wakeel (representative) for ${profileName}. I'm here to share information about him honestly and respectfully. Feel free to ask me anything about his background, values, goals, or expectations for marriage.`;

  const storageKey = `nikah_chat_${slug}`;

  const [messages, setMessages] = useState<Message[]>([
    { id: "greeting", role: "ai", content: greeting },
  ]);

  // Load persisted messages after mount to avoid SSR/client mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (parsed.length > 0) setMessages(parsed);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // IDs of answered questions already delivered into chat — avoids duplicates
  const deliveredAnswerIds = useRef<Set<string>>(new Set());

  // Pre-populate with already-answered questions so we don't replay history on mount
  useEffect(() => {
    supabase
      .from("pending_questions")
      .select("id")
      .eq("profile_id", profileId)
      .eq("status", "answered")
      .then(({ data }) => {
        for (const row of data ?? []) deliveredAnswerIds.current.add(row.id);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  // ── Realtime: watch pending_questions for this profile ───────────────────
  // When the boy answers, deliver the answer into chat instantly.

  useEffect(() => {
    const channel = supabase
      .channel(`agent_answers:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pending_questions",
        },
        (payload) => {
          console.log("[AgentChat] realtime UPDATE received:", payload.new);
          const updated = payload.new as {
            id: string;
            status: string;
            answer_text: string | null;
          };

          if (
            updated.status === "answered" &&
            updated.answer_text &&
            !deliveredAnswerIds.current.has(updated.id)
          ) {
            deliveredAnswerIds.current.add(updated.id);
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "ai",
                content: `I just heard back from ${profileName}! He says: "${updated.answer_text}"`,
              },
            ]);
          }
        }
      )
      .subscribe((status, err) => {
        console.log("[AgentChat] realtime subscription status:", status, err ?? "");
      });

    return () => { supabase.removeChannel(channel); };
  }, [profileId, profileName]);

  // ── Polling fallback: fetch all answered questions every 5s ──────────────

  useEffect(() => {
    const id = setInterval(async () => {
      const { data, error } = await supabase
        .from("pending_questions")
        .select("id, answer_text")
        .eq("profile_id", profileId)
        .eq("status", "answered");

      if (error) {
        console.error("[AgentChat] polling error:", error.message);
        return;
      }

      for (const row of data ?? []) {
        if (row.answer_text && !deliveredAnswerIds.current.has(row.id)) {
          deliveredAnswerIds.current.add(row.id);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "ai",
              content: `I just heard back from ${profileName}! He says: "${row.answer_text}"`,
            },
          ]);
        }
      }
    }, 5000);

    return () => clearInterval(id);
  }, [profileId, profileName]);

  // ── Send message ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, slug }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        content: data.reply || "I'm sorry, I couldn't process that request.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, thinking, messages, slug]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        backgroundColor: C.bg,
        maxWidth: 680,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          backgroundColor: C.card,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <WakilAvatar size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            AI Wakeel for {profileName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 2,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: C.green,
                boxShadow: `0 0 6px ${C.green}`,
              }}
            />
            <span style={{ fontSize: 11, color: C.green }}>Online</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.textMuted,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div>Powered by</div>
          <div style={{ color: C.gold, fontWeight: 600 }}>Nikah AI</div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.role === "ai" ? "row" : "row-reverse",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {msg.role === "ai" && <WakilAvatar size={28} />}

            <div
              style={{
                maxWidth: "78%",
                padding: "10px 14px",
                borderRadius:
                  msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                backgroundColor: msg.role === "ai" ? C.card : C.userBubble,
                border: `1px solid ${msg.role === "ai" ? C.border : C.userBorder}`,
                fontSize: 14,
                lineHeight: 1.6,
                color: C.text,
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {thinking && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <WakilAvatar size={28} />
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "4px 16px 16px 16px",
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <ThinkingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "12px 16px",
          borderTop: `1px solid ${C.border}`,
          backgroundColor: C.card,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about him…"
          disabled={thinking}
          style={{
            flex: 1,
            backgroundColor: C.bg,
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            padding: "10px 16px",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.15s",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = C.gold)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || thinking}
          aria-label="Send"
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: "50%",
            backgroundColor: !input.trim() || thinking ? C.border : C.gold,
            border: "none",
            cursor: !input.trim() || thinking ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13"
              stroke={!input.trim() || thinking ? C.textMuted : C.bg}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 2L15 22L11 13L2 9L22 2Z"
              stroke={!input.trim() || thinking ? C.textMuted : C.bg}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
