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

      <footer className="relative z-10 mt-24 pb-8 text-xs" style={{ color: "#3a3650" }}>
        © {new Date().getFullYear()} Nikah AI. All rights reserved.
      </footer>
    </main>
  );
}
