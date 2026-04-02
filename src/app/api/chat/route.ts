import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Never cache this route — always fetch the latest system prompt from the DB
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Phrases that signal the AI couldn't answer — trigger a pending question
const UNANSWERED_SIGNALS = [
  "hasn't shared",
  "haven't been told",
  "don't have information",
  "not shared",
  "didn't mention",
  "no information about",
  "i'll ask him",
  "get back to you",
  "haven't shared",
  "hasn't mentioned",
  "not been provided",
  "unable to answer",
  "hasn't provided",
];

function isUnanswered(reply: string): boolean {
  const lower = reply.toLowerCase();
  return UNANSWERED_SIGNALS.some((phrase) => lower.includes(phrase));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, slug } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      slug: string;
    };

    if (!slug || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing slug or messages" }, { status: 400 });
    }

    // Fetch the latest profile on every request — no caching.
    const { data: profile, error } = await supabaseAnon
      .from("profiles")
      .select("id, user_id, name, full_system_prompt")
      .eq("slug", slug)
      .single();

    if (error || !profile) {
      console.error("[/api/chat] profile not found for slug:", slug, error?.message);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const systemPrompt =
      profile.full_system_prompt?.trim() ||
      `You are an AI Wakeel (representative) for ${profile.name}. Answer questions about him honestly and respectfully for marriage purposes. If you don't know something, say "He hasn't shared that yet — I'll ask him and get back to you."`;

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    console.log("[/api/chat] Claude reply:", reply);

    // Detect unanswered questions
    const triggered = isUnanswered(reply);
    console.log("[/api/chat] unanswered detection triggered:", triggered);

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && triggered) {
      const questionText = lastUserMsg.content.trim();

      // Generate ID client-side so we can return it without needing SELECT-back
      const pqId = crypto.randomUUID();
      const pqPayload = {
        id: pqId,
        profile_id: profile.id,
        question_text: questionText,
        status: "pending",
        session_id: null,
      };
      console.log("[/api/chat] CREATING PENDING QUESTION, payload:", JSON.stringify(pqPayload));

      const { error: pqError } = await supabaseAnon
        .from("pending_questions")
        .insert(pqPayload);

      if (pqError) {
        console.error("[/api/chat] pending_question insert failed — code:", pqError.code, "| message:", pqError.message, "| details:", pqError.details, "| hint:", pqError.hint);
      } else {
        console.log("[/api/chat] pending_question created ✓, id:", pqId);
      }

      const { error: notifError } = await supabaseAnon
        .from("notifications")
        .insert({
          user_id: profile.user_id,
          type: "new_question",
          content: questionText,
          read: false,
        });

      if (notifError) {
        console.error("[/api/chat] notification insert failed:", notifError.message);
      } else {
        console.log("[/api/chat] notification created ✓");
      }

      // Return the pending question ID so AgentChat can watch for the answer
      return NextResponse.json({ reply, pending_question_id: pqId });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
