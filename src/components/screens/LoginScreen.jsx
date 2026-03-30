import { useState } from "react";
import { T, serif, mono } from "../../data/tokens";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  { key: "admin",   label: "Admin",   sub: "Platform-wide access", icon: "🛡️", color: T.blue,   bg: "#0f0e17", grad: `linear-gradient(135deg, ${T.blue}, #7b6cff)` },
  { key: "teacher", label: "Teacher", sub: "Course management",    icon: "📚", color: "#a855f7", bg: "#120e1f", grad: "linear-gradient(135deg, #a855f7, #7b3fcf)"    },
  { key: "student", label: "Student", sub: "Take exams",           icon: "🎓", color: "#00c896", bg: "#0a1a14", grad: `linear-gradient(135deg, #00c896, #00a07a)`     },
];

export default function LoginScreen({ onLogin }) {
  const { login } = useAuth();

  const [hovRole, setHovRole]   = useState(null);
  const [step, setStep]         = useState("role");       // "role" | "creds"
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const role = ROLES.find(r => r.key === selectedRole);

  const pickRole = (key) => {
    setSelectedRole(key);
    setUsername("");
    setPassword("");
    setError("");
    setStep("creds");
  };

  const handleSignIn = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(username.trim(), password, selectedRole);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid credentials. Check username, password and role.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasValue) => ({
    width: "100%", padding: "12px 14px", borderRadius: 12,
    background: "#1a1930",
    border: `1.5px solid ${hasValue ? role?.color + "80" : T.ink4}`,
    color: T.ghost, fontSize: 14,
    fontFamily: "'Sora', system-ui, sans-serif",
    transition: "border-color 0.2s",
    outline: "none",
  });

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: T.ink, position: "relative", overflow: "hidden",
    }}>
      {/* Bg glow */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${step === "creds" ? role?.color + "12" : T.blue + "14"} 0%, transparent 70%)`,
        top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none",
        transition: "background 0.4s",
      }} />

      {/* ── STEP 1: Role selection ── */}
      {step === "role" && (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: T.mint, marginBottom: 16 }}>
              Online Examination Platform
            </div>
            <h1 style={{ ...serif, fontSize: 56, lineHeight: 1.05, color: T.paper, marginBottom: 10 }}>
              Proctor<span style={{ color: "#8ca0ff", fontStyle: "italic" }}>OS</span>
            </h1>
            <p style={{ fontSize: 14, color: T.muted, maxWidth: 380 }}>
              Secure, intelligent online examinations with real-time proctoring and deep analytics.
            </p>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {ROLES.map((r, idx) => (
              <div
                key={r.key}
                onClick={() => pickRole(r.key)}
                onMouseEnter={() => setHovRole(r.key)}
                onMouseLeave={() => setHovRole(null)}
                style={{
                  width: 200, padding: "28px 24px", borderRadius: 20,
                  background: hovRole === r.key ? r.bg : T.ink2,
                  border: `1.5px solid ${hovRole === r.key ? r.color + "60" : T.ink4}`,
                  cursor: "pointer", transition: "all 0.2s",
                  transform: hovRole === r.key ? "translateY(-4px)" : "none",
                  boxShadow: hovRole === r.key ? `0 12px 40px ${r.color}20` : "none",
                  animation: "fadeIn 0.4s ease forwards",
                  animationDelay: idx * 80 + "ms", opacity: 0,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{r.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: hovRole === r.key ? r.color : T.ghost, marginBottom: 4 }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>{r.sub}</div>
                <div style={{
                  marginTop: 18, fontSize: 12, color: r.color,
                  opacity: hovRole === r.key ? 1 : 0, transition: "opacity 0.2s", fontWeight: 500,
                }}>
                  Sign in →
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...mono, fontSize: 10, color: T.ink4, marginTop: 40, letterSpacing: "0.05em" }}>
            Select your access level to continue
          </p>
        </div>
      )}

      {/* ── STEP 2: Credentials ── */}
      {step === "creds" && role && (
        <div className="fade-in" style={{ width: 400, position: "relative" }}>
          {/* Role pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button
              onClick={() => { setStep("role"); setError(""); }}
              style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>
              ←
            </button>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 20,
              background: role.color + "18", border: `1px solid ${role.color}30`,
              fontSize: 12, fontWeight: 600, color: role.color,
            }}>
              <span>{role.icon}</span> {role.label} Access
            </div>
          </div>

          <h1 style={{ ...serif, fontSize: 34, color: T.paper, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>
            Sign in with your ProctorOS username.
          </p>

          {/* Avatar */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: role.grad,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, color: "white", fontWeight: 700,
              boxShadow: `0 0 0 4px ${role.color}20`,
            }}>
              {role.icon}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {/* Username */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Username
              </label>
              <input
                type="text" value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSignIn()}
                placeholder="yourname"
                style={inputStyle(username)}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSignIn()}
                  placeholder="••••••••"
                  style={inputStyle(password)}
                />
                <button
                  onClick={() => setShowPw(s => !s)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: T.muted, cursor: "pointer",
                    fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif",
                  }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "#fff0f3", border: `1px solid ${T.pink}40`,
              fontSize: 12, color: T.pink,
            }}>
              {error}
            </div>
          )}

          {/* Sign in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: 12,
              background: loading ? role.color + "80" : role.grad,
              border: "none", color: "white", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Sora', system-ui, sans-serif",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Signing in…
              </>
            ) : (
              `Sign in as ${role.label} →`
            )}
          </button>

          <p style={{ ...mono, fontSize: 10, color: T.ink4, marginTop: 20, textAlign: "center", letterSpacing: "0.05em" }}>
            Your username and password are set by your administrator
          </p>
        </div>
      )}
    </div>
  );
}
