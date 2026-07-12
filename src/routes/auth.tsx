// @ts-nocheck
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish — GORIEEE Admin" },
      { name: "description", content: "Admin va xodim kirish sahifasi." },
    ],
  }),
  component: AuthPage,
});

function normalizeEmail(raw: string) {
  const v = (raw || "").trim();
  if (!v) return "";
  if (!v.includes("@")) return `${v.toLowerCase()}@svitlo.local`;
  const [local, domain] = v.split("@");
  if (!domain.includes(".")) return `${local.toLowerCase()}@${domain.toLowerCase()}.local`;
  return v.toLowerCase();
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [needSignup, setNeedSignup] = useState(false);

  useEffect(() => {
    // If already signed in, try claiming first-admin then bounce home
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        try { await supabase.rpc("claim_first_admin"); } catch {}
      }
    })();

    // Check if any admin exists — if not, hint signup
    (async () => {
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) === 0) setNeedSignup(true);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const em = normalizeEmail(email);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: em,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Ensure session (auto-confirm is on)
        if (!(await supabase.auth.getSession()).data.session) {
          const { error: sErr } = await supabase.auth.signInWithPassword({ email: em, password });
          if (sErr) throw sErr;
        }
        const { data: claimed } = await supabase.rpc("claim_first_admin");
        setMsg(claimed ? "Admin sifatida ro'yxatdan o'tdingiz!" : "Ro'yxatdan o'tdingiz. Admin huquqi berilmadi.");
        setTimeout(() => navigate({ to: "/" }), 600);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password });
        if (error) throw error;
        try { await supabase.rpc("claim_first_admin"); } catch {}
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setMsg(err?.message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "radial-gradient(circle at 50% -10%, #1C1C22 0%, #0B0B0E 55%)",
      color: "#F5F5F7", fontFamily: "'Inter','SF Pro Display','Segoe UI',sans-serif",
      padding: 20,
    }}>
      <form onSubmit={submit} style={{
        width: "100%", maxWidth: 380, padding: 28, borderRadius: 20,
        background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          {mode === "signup" ? "Ro'yxatdan o'tish" : "Admin kirish"}
        </h1>
        <p style={{ margin: "6px 0 18px", fontSize: 13, color: "#98989F" }}>
          {needSignup && mode === "signin"
            ? "Hali admin yo'q — pastdagi 'Ro'yxatdan o'tish' orqali birinchi admin bo'ling."
            : "GORIEEE boshqaruv paneli"}
        </p>

        <label style={{ display: "block", fontSize: 12, color: "#98989F", marginBottom: 6 }}>Login yoki email</label>
        <input
          value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"
          placeholder="masalan: svitlogorie@urg"
          style={inputStyle} required
        />

        <label style={{ display: "block", fontSize: 12, color: "#98989F", margin: "12px 0 6px" }}>Parol</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={6} placeholder="Kamida 6 ta belgi"
          style={inputStyle} required
        />

        {msg && (
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 12, fontSize: 13,
            background: "rgba(255,92,108,0.12)", color: "#FF9AA5", border: "1px solid rgba(255,92,108,0.3)",
          }}>{msg}</div>
        )}

        <button type="submit" disabled={busy} style={{
          marginTop: 18, width: "100%", padding: "12px 16px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#7C6CFF,#4C5FD5)", color: "#fff",
          fontWeight: 700, fontSize: 14, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
        }}>
          {busy ? "Kutilmoqda..." : mode === "signup" ? "Ro'yxatdan o'tish" : "Kirish"}
        </button>

        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }} style={{
          marginTop: 12, width: "100%", padding: "10px", borderRadius: 12, background: "transparent",
          color: "#B3A8FF", border: "1px solid rgba(124,108,255,0.3)", fontSize: 13, fontWeight: 600,
        }}>
          {mode === "signin" ? "Ro'yxatdan o'tish" : "Kirish sahifasiga qaytish"}
        </button>

        <button type="button" onClick={() => navigate({ to: "/" })} style={{
          marginTop: 8, width: "100%", padding: "8px", background: "transparent",
          color: "#98989F", border: "none", fontSize: 12,
        }}>
          ← Do'konga qaytish
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
  color: "#F5F5F7", fontSize: 14, outline: "none",
};
