import { useState } from "react";
import { T, serif, mono } from "../../data/tokens";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { userAPI } from "../../services/api";
import Btn from "../ui/Btn";

const ROLE_COLOR = { admin: T.blue, teacher: "#a855f7", student: T.mint };

function SectionHeader({ children }) {
  return (
    <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 4, marginTop: 28 }}>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange, accent }) {
  // accent=true → use var(--accent) for the active colour (role-based)
  const activeColor  = accent ? "var(--accent)"    : T.blue;
  const activeBorder = accent ? "var(--accent-bd)" : T.blue;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid var(--border)` }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{description}</div>}
      </div>
      <div onClick={onChange} style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? activeColor : "var(--bg3)",
        border: `2px solid ${value ? activeBorder : "var(--border2)"}`,
        position: "relative", transition: "all 0.2s", cursor: "pointer", flexShrink: 0, marginLeft: 16,
      }}>
        <div style={{
          position: "absolute", top: 2, left: value ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: "white", transition: "left 0.2s",
          boxShadow: value ? `0 0 6px ${accent ? "var(--accent)" : T.blue}60` : "none",
        }} />
      </div>
    </div>
  );
}

function SelectRow({ label, description, options, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${T.ink3}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{description}</div>}
      </div>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: T.ink3, border: `1px solid ${T.ink4}`, borderRadius: 8,
          color: T.ghost, fontSize: 12, padding: "6px 10px", cursor: "pointer",
          fontFamily: "'Sora', system-ui, sans-serif", marginLeft: 16,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Credentials form ─────────────────────────────────────────────────────────
function CredentialsSection({ user, notify, updateUserName }) {
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername,     setNewUsername]      = useState("");
  const [newPassword,     setNewPassword]      = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [showCurrent,     setShowCurrent]      = useState(false);
  const [showNew,         setShowNew]          = useState(false);
  const [saving,          setSaving]           = useState(false);
  const [success,         setSuccess]          = useState("");
  const [error,           setError]            = useState("");

  const inputStyle = (active) => ({
    flex: 1, padding: "10px 14px", borderRadius: 10,
    background: T.ink3,
    border: `1.5px solid ${active ? T.blue + "80" : T.ink4}`,
    color: T.ghost, fontSize: 13,
    fontFamily: "'Sora', system-ui, sans-serif",
    outline: "none", transition: "border-color 0.2s",
  });

  const handleSave = async () => {
    setError(""); setSuccess("");

    if (!currentPassword) { setError("Current password is required."); return; }
    if (!newUsername && !newPassword) { setError("Enter a new username or new password (or both)."); return; }
    if (newPassword && newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    if (newPassword && newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newUsername && newUsername === user?.username) { setError("That is already your current username."); return; }

    setSaving(true);
    try {
      const res = await userAPI.updateCredentials(
        currentPassword,
        newUsername || undefined,
        newPassword || undefined,
      );
      setSuccess(res.message || "Credentials updated!");
      setCurrentPassword(""); setNewUsername(""); setNewPassword(""); setConfirmPassword("");

      // If username changed, the JWT is still valid but we should update local display
      if (newUsername) {
        // Prompt fresh login so the stored user object is consistent
        setTimeout(() => {
          notify("Username changed — please log in again.", "warn");
          logout();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Could not update credentials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px 22px 18px" }}>
      <div style={{ fontSize: 13, color: T.ghost, fontWeight: 600, marginBottom: 4 }}>Change Username or Password</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>
        Current password is required to confirm your identity. Leave a field blank to keep it unchanged.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Current password */}
        <div>
          <label style={{ fontSize: 11, color: T.dim, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Current Password *
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); setError(""); }}
              placeholder="Your current password"
              style={{ ...inputStyle(currentPassword), flex: 1 }}
            />
            <button onClick={() => setShowCurrent(s => !s)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "'Sora', system-ui, sans-serif", flexShrink: 0 }}>
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New username */}
        <div>
          <label style={{ fontSize: 11, color: T.dim, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            New Username <span style={{ color: T.ink4, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={newUsername}
            onChange={e => { setNewUsername(e.target.value.trim()); setError(""); }}
            placeholder={`Current: ${user?.username || "—"}`}
            style={{ ...inputStyle(newUsername), width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
            Must be unique — you'll be logged out to refresh your session.
          </div>
        </div>

        {/* New password */}
        <div>
          <label style={{ fontSize: 11, color: T.dim, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            New Password <span style={{ color: T.ink4, fontWeight: 400 }}>(optional)</span>
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(""); }}
              placeholder="6+ characters"
              style={{ ...inputStyle(newPassword), flex: 1 }}
            />
            <button onClick={() => setShowNew(s => !s)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "'Sora', system-ui, sans-serif", flexShrink: 0 }}>
              {showNew ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm new password */}
        {newPassword && (
          <div className="slide-in">
            <label style={{ fontSize: 11, color: T.dim, fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Confirm New Password
            </label>
            <input
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Repeat new password"
              style={{
                ...inputStyle(confirmPassword),
                width: "100%", boxSizing: "border-box",
                borderColor: confirmPassword && confirmPassword !== newPassword ? T.pink + "80" : confirmPassword ? T.mint + "80" : T.ink4,
              }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <div style={{ fontSize: 11, color: T.pink, marginTop: 4 }}>Passwords do not match</div>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: T.pinkLight, border: `1px solid ${T.pink}30`, fontSize: 12, color: T.pink }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: T.mintLight, border: `1px solid ${T.mint}30`, fontSize: 12, color: "#1a7a5e" }}>
          ✓ {success}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn variant="primary" onClick={handleSave} disabled={saving} style={{ padding: "10px 24px" }}>
          {saving ? "Saving…" : "Update Credentials"}
        </Btn>
      </div>
    </div>
  );
}

// ── Main settings screen ────────────────────────────────────────────────────
export default function SettingsScreen({ user, setScreen }) {
  const { updateUserName } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const roleColor = ROLE_COLOR[user?.role] || T.blue;
  const backScreen = user?.role === "student" ? "studentDash" : user?.role === "teacher" ? "teacherDash" : "adminDash";

  // Notification prefs (UI only — would need backend persistence to make real)
  const [emailNotifs,       setEmailNotifs]       = useState(true);
  const [examReminders,     setExamReminders]     = useState(true);
  const [violationAlerts,   setViolationAlerts]   = useState(true);
  const [resultNotifs,      setResultNotifs]      = useState(true);
  const [weeklyDigest,      setWeeklyDigest]      = useState(false);

  // Appearance
  const [compactView,       setCompactView]       = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [language,          setLanguage]          = useState("en");
  const [timezone,          setTimezone]          = useState("Asia/Kolkata");

  // Proctoring defaults
  const [autoSubmit,        setAutoSubmit]        = useState(true);
  const [tabWarnings,       setTabWarnings]       = useState(true);
  const [faceDetection,     setFaceDetection]     = useState(true);
  const [defaultStrictness, setDefaultStrictness] = useState("moderate");

  const [notify, setNotify] = useState(null);
  const showNotify = (msg, type = "warn") => {
    setNotify({ msg, type });
    setTimeout(() => setNotify(null), 3500);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 56, background: "var(--topbar)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setScreen(backScreen)} style={{
            background: "none", border: "none", color: T.muted, fontSize: 13,
            cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif",
          }}>←</button>
          <div style={{ ...serif, fontSize: 18, color: T.ghost }}>Settings</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "36px 28px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* Account badge */}
          <div className="fade-in" style={{
            display: "flex", alignItems: "center", gap: 14,
            background: T.ink2, border: `1px solid ${T.ink3}`,
            borderRadius: 14, padding: "16px 20px", marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${roleColor}, ${roleColor}aa)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "white", fontWeight: 700,
            }}>{user?.initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ghost }}>{user?.name}</div>
              <div style={{ ...mono, fontSize: 11, color: T.muted }}>@{user?.username} · {user?.role}</div>
            </div>
            <button onClick={() => setScreen("profile")} style={{
              marginLeft: "auto", padding: "6px 14px", borderRadius: 8,
              background: "transparent", border: `1px solid ${T.ink4}`,
              color: T.muted, fontSize: 12, cursor: "pointer",
              fontFamily: "'Sora', system-ui, sans-serif",
            }}>
              View Profile →
            </button>
          </div>

          {/* ── Security (credentials) — REAL ── */}
          <SectionHeader>Security — Change Username or Password</SectionHeader>
          <CredentialsSection user={user} notify={showNotify} updateUserName={updateUserName} />

          {/* ── Notifications ── */}
          <SectionHeader>Notifications</SectionHeader>
          <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "0 20px" }}>
            <ToggleRow label="Email Notifications"  description="Receive updates via email"           value={emailNotifs}     onChange={() => setEmailNotifs(v => !v)} />
            <ToggleRow label="Exam Reminders"        description="Alerts 1 hour before exams start"   value={examReminders}   onChange={() => setExamReminders(v => !v)} />
            <ToggleRow label="Violation Alerts"      description="Instant alerts for flagged events"  value={violationAlerts} onChange={() => setViolationAlerts(v => !v)} />
            <ToggleRow label="Result Notifications"  description="Notify when results are published"  value={resultNotifs}    onChange={() => setResultNotifs(v => !v)} />
            <ToggleRow label="Weekly Digest"         description="Summary email every Monday"         value={weeklyDigest}    onChange={() => setWeeklyDigest(v => !v)} />
          </div>

          {/* ── Appearance ── */}
          <SectionHeader>Appearance & Language</SectionHeader>
          <div style={{ background: "var(--bg2)", border: `1px solid var(--border)`, borderRadius: 16, padding: "0 20px" }}>
            <ToggleRow
              label="Dark Mode"
              description={isDark ? "Switch to light theme" : "Switch to dark theme"}
              value={isDark}
              onChange={toggleTheme}
              accent
            />
            <ToggleRow label="Compact View"      description="Reduce padding and spacing across the UI" value={compactView}       onChange={() => setCompactView(v => !v)} />
            <ToggleRow label="Enable Animations" description="Fade-in and transition effects"           value={animationsEnabled} onChange={() => setAnimationsEnabled(v => !v)} />
            <SelectRow
              label="Language" description="Interface display language"
              value={language} onChange={setLanguage}
              options={[
                { value: "en", label: "English" },
                { value: "hi", label: "Hindi"   },
                { value: "ta", label: "Tamil"   },
                { value: "fr", label: "French"  },
              ]}
            />
            <SelectRow
              label="Timezone" description="Used for exam schedules and timestamps"
              value={timezone} onChange={setTimezone}
              options={[
                { value: "Asia/Kolkata",     label: "IST — India Standard Time"    },
                { value: "America/New_York", label: "EST — Eastern Standard Time"  },
                { value: "Europe/London",    label: "GMT — Greenwich Mean Time"    },
                { value: "Asia/Singapore",   label: "SGT — Singapore Time"         },
              ]}
            />
          </div>

          {/* ── Proctoring (teacher/admin only) ── */}
          {user?.role !== "student" && (
            <>
              <SectionHeader>Proctoring Defaults</SectionHeader>
              <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "0 20px" }}>
                <ToggleRow label="Auto-Submit on Threshold" description="Automatically submit when violation limit is reached" value={autoSubmit}    onChange={() => setAutoSubmit(v => !v)} />
                <ToggleRow label="Tab Switch Warnings"      description="Warn students when they leave the exam window"       value={tabWarnings}   onChange={() => setTabWarnings(v => !v)} />
                <ToggleRow label="Face Detection"           description="Require a visible face throughout the exam"          value={faceDetection} onChange={() => setFaceDetection(v => !v)} />
                <SelectRow
                  label="Default Strictness" description="Applied to new exams unless overridden"
                  value={defaultStrictness} onChange={setDefaultStrictness}
                  options={[
                    { value: "lenient",  label: "🌿 Lenient"  },
                    { value: "moderate", label: "⚖️ Moderate" },
                    { value: "strict",   label: "🔒 Strict"   },
                  ]}
                />
              </div>
            </>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* Inline notification toast */}
      {notify && (
        <div className="fade-in" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "12px 18px", borderRadius: 12, maxWidth: 340,
          background: notify.type === "critical" ? T.pinkLight : T.amberLight,
          border: `1px solid ${notify.type === "critical" ? T.pink + "50" : T.amber + "50"}`,
          color: notify.type === "critical" ? T.pink : "#b07a10",
          fontSize: 13, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}>
          {notify.type === "critical" ? "🚨" : "⚠️"} {notify.msg}
        </div>
      )}
    </div>
  );
}
