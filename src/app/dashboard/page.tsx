import { redirect } from "next/navigation";
import ProfileBuilder from "@/components/ProfileBuilder";
import NotificationInbox from "@/components/NotificationInbox";
import CopyLinkButton from "@/components/CopyLinkButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function ensureProfile(userId: string, fullName: string) {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  const firstName =
    fullName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const slug = `${firstName}-${randomDigits}`;

  await supabase.from("profiles").insert({
    user_id: userId,
    name: fullName,
    slug,
    categories: {},
    voice_transcripts: [],
    full_system_prompt: "",
  });
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const fullName: string =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "user";

  await ensureProfile(user.id, fullName);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f1119",
        }}
      >
        <p style={{ color: "#8a8698" }}>Failed to load profile. Please refresh.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f1119",
        padding: "24px 24px 40px",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 12,
        }}
      >
        {/* Left: title + welcome */}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{ fontSize: 22, fontWeight: 700, color: "#c8a96e", margin: 0 }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#8a8698",
              marginTop: 4,
              marginBottom: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Welcome back, {fullName.split(" ")[0]}
          </p>
        </div>

        {/* Right: notification bell + copy link */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <NotificationInbox
            userId={user.id}
            profileId={profile.id}
          />
          <CopyLinkButton slug={profile.slug} />
        </div>
      </header>

      {/* ── Profile builder ── */}
      <ProfileBuilder
        profile={{
          user_id: profile.user_id,
          name: profile.name,
          categories: profile.categories,
          full_system_prompt: profile.full_system_prompt,
        }}
      />
    </main>
  );
}
