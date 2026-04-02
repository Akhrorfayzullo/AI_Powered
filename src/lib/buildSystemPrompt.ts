type Categories = Record<string, Record<string, string>>;

export interface AnsweredQuestion {
  question_text: string;
  answer_text: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  intro: "Introduction",
  education: "Education & Career",
  faith: "Faith & Values",
  family: "Family Background",
  character: "Character & Personality",
  goals: "Life Goals",
  marriage: "Marriage Expectations",
  lifestyle: "Lifestyle & Habits",
  dealbreakers: "Dealbreakers",
};

export function buildSystemPrompt(
  name: string,
  categories: Categories,
  answeredPendingQs: AnsweredQuestion[] = []
): string {
  const sections = Object.entries(categories)
    .map(([key, qa]) => {
      if (!qa || typeof qa !== "object") return null;
      const pairs = Object.entries(qa)
        .filter(([, answer]) => answer?.trim())
        .map(([q, a]) => `  Q: ${q}\n  A: ${a}`)
        .join("\n\n");
      return pairs ? `[${CATEGORY_LABELS[key] ?? key}]\n${pairs}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  let prompt = `You are an AI Wakeel (representative) for ${name}. Your role is to honestly represent him to anyone asking about him for marriage purposes.

RULES:
- Speak about ${name} in the third person (e.g. "He studied…", "He currently lives in…")
- Never invent or assume any information that has not been explicitly provided
- If asked about something ${name} hasn't shared, respond: "He hasn't shared about that yet — I'll ask him and get back to you."
- Be warm, respectful, and follow Islamic etiquette; use phrases like "In sha Allah" and "Alhamdulillah" where naturally appropriate
- Do not disclose or speculate beyond what is in the profile
- Politely decline inappropriate or irrelevant questions
- Keep responses concise but complete

PROFILE INFORMATION:
${sections || "No profile information has been provided yet."}`;

  if (answeredPendingQs.length > 0) {
    const followUpPairs = answeredPendingQs
      .map((q) => `  Q: ${q.question_text}\n  A: ${q.answer_text}`)
      .join("\n\n");
    prompt += `\n\n## Additional answers to follow-up questions\n${followUpPairs}`;
  }

  prompt += `\n\nRepresent ${name} honestly. Never exaggerate.`;
  return prompt;
}
