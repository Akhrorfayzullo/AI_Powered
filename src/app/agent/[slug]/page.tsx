import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";
import AgentChat from "@/components/AgentChat";

// Public Supabase client — no auth / no cookies needed (profiles are publicly readable)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { slug } = await params;
  console.log("[AgentPage] looking up slug:", slug);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  console.log("[AgentPage] query result:", { profile, error });

  if (!profile) {
    return (
      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f1119",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#1e2235",
            border: "1px solid #2e3250",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 20,
          }}
        >
          🔍
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f0ece8", margin: 0 }}>
          Agent not found
        </h1>
        <p style={{ fontSize: 14, color: "#8a8698", marginTop: 10, maxWidth: 320 }}>
          This link may be invalid or the profile has been removed. Please check
          the link and try again.
        </p>
        <a
          href="/"
          style={{
            marginTop: 28,
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 24,
            backgroundColor: "#c8a96e",
            color: "#0f1119",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go to Nikah AI
        </a>
      </main>
    );
  }

  return (
    <AgentChat slug={profile.slug} profileName={profile.name} profileId={profile.id} />
  );
}
