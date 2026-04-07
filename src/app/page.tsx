import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#0f1119" }}
    >
      {/* Subtle glow accent */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "#c8a96e" }}
        />
      </div>

      <div className="relative z-10 max-w-2xl">
        <p
          className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: "#c8a96e" }}
        >
          Introducing
        </p>

        <h1
          className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl"
          style={{ color: "#f0ece8" }}
        >
          Nikah AI
        </h1>

        <p
          className="mt-2 text-2xl font-light sm:text-3xl"
          style={{ color: "#c8a96e" }}
        >
          Your AI Wakeel
        </p>

        <p
          className="mx-auto mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
          style={{ color: "#8a8698" }}
        >
          Build a living marriage profile. Share a link. Let your AI agent
          answer questions on your behalf — honestly, thoughtfully, and on
          your terms.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth"
            className="rounded-full px-8 py-3 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#c8a96e", color: "#0f1119" }}
          >
            Get Started
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border px-8 py-3 text-sm font-semibold tracking-wide transition-colors hover:border-[#c8a96e]"
            style={{ borderColor: "#2e3250", color: "#8a8698" }}
          >
            How it works
          </a>
        </div>
      </div>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 mt-32 w-full max-w-3xl"
      >
        <h2
          className="mb-10 text-xl font-semibold"
          style={{ color: "#f0ece8" }}
        >
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Build your profile",
              body: "Answer guided questions about yourself, your deen, and what you're looking for.",
            },
            {
              step: "02",
              title: "Share your link",
              body: "Send interested families a personal link. Your AI agent handles questions 24/7.",
            },
            {
              step: "03",
              title: "Stay in control",
              body: "Review every conversation. Answer escalated questions on your own time.",
            },
          ].map(({ step, title, body }) => (
            <div
              key={step}
              className="rounded-2xl p-6 text-left"
              style={{ backgroundColor: "#1e2235" }}
            >
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: "#c8a96e" }}
              >
                {step}
              </span>
              <h3
                className="mt-2 text-base font-semibold"
                style={{ color: "#f0ece8" }}
              >
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#8a8698" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What's Coming Next */}
      <section className="relative z-10 mt-32 w-full max-w-2xl">
        <style>{`
          @keyframes nikah-fadein {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .nikah-timeline-item {
            animation: nikah-fadein 0.5s ease both;
          }
          .nikah-timeline-item:nth-child(1) { animation-delay: 0.05s; }
          .nikah-timeline-item:nth-child(2) { animation-delay: 0.15s; }
          .nikah-timeline-item:nth-child(3) { animation-delay: 0.25s; }
          .nikah-timeline-item:nth-child(4) { animation-delay: 0.35s; }
          .nikah-timeline-item:nth-child(5) { animation-delay: 0.45s; }
          .nikah-timeline-item:nth-child(6) { animation-delay: 0.55s; }
          .nikah-timeline-item:nth-child(7) { animation-delay: 0.65s; }
        `}</style>

        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: "#c8a96e" }}
        >
          Roadmap
        </p>
        <h2
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "#f0ece8" }}
        >
          What&apos;s Coming Next
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#8a8698" }}>
          We&apos;re just getting started.
        </p>

        {/* Timeline */}
        <div className="relative mt-12 text-left">
          {/* Vertical gold line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px"
            style={{ backgroundColor: "#c8a96e", opacity: 0.25 }}
            aria-hidden
          />

          <div className="flex flex-col gap-6">
            {[
              {
                icon: "📱",
                title: "Telegram Integration",
                desc: "Chat with any Wakeel directly through Telegram — no app download needed. Share your agent as a simple Telegram bot link.",
              },
              {
                icon: "💬",
                title: "Import Chat History",
                desc: "Connect your Telegram or WhatsApp history so your AI agent truly understands how you communicate — your tone, your humor, your personality.",
              },
              {
                icon: "🎙️",
                title: "Voice Conversations",
                desc: "Talk to a Wakeel by voice instead of typing. The AI speaks back naturally, making it feel like a real conversation with a representative.",
              },
              {
                icon: "📲",
                title: "Standalone Mobile App",
                desc: "A dedicated app with smart matching — no more endless scrolling through profiles. Your AI agent does the screening for you.",
              },
              {
                icon: "🤝",
                title: "AI-to-AI Matching",
                desc: "Both sides create their Wakeel. The two AI agents have a conversation first, identify compatibility, and recommend whether to proceed.",
              },
              {
                icon: "👨‍👩‍👧",
                title: "Family Portal",
                desc: "A separate view for parents and guardians to ask their own questions and review compatibility — because family matters.",
              },
              {
                icon: "🌍",
                title: "Built for Everyone",
                desc: "Perfect for shy people, long-distance situations, busy professionals, or anyone who finds first conversations awkward. No more pressure — let your AI break the ice.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="nikah-timeline-item relative flex gap-5 pl-14">
                {/* Dot on the line */}
                <div
                  className="absolute left-[19px] top-5 h-3 w-3 -translate-x-1/2 rounded-full border-2"
                  style={{ borderColor: "#c8a96e", backgroundColor: "#0f1119" }}
                  aria-hidden
                />

                {/* Card */}
                <div
                  className="w-full rounded-2xl px-5 py-4"
                  style={{ backgroundColor: "#1e2235" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-2xl leading-none" role="img" aria-label={title}>
                      {icon}
                    </span>
                    <div>
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: "#c8a96e" }}
                      >
                        {title}
                      </h3>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: "#8a8698" }}
                      >
                        {desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <p className="mt-12 text-sm" style={{ color: "#8a8698" }}>
          Have a feature idea?{" "}
          <a
            href="mailto:hello@nikah-ai.com"
            className="font-medium underline underline-offset-2 transition-colors hover:text-[#c8a96e]"
            style={{ color: "#c8a96e" }}
          >
            We&apos;d love to hear from you.
          </a>
        </p>
      </section>

      <footer className="relative z-10 mt-24 pb-8 text-xs" style={{ color: "#3a3650" }}>
        © {new Date().getFullYear()} Nikah AI. All rights reserved.
      </footer>
    </main>
  );
}
