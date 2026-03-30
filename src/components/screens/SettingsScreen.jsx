import { useState } from "react";
import { T, serif, mono } from "../../data/tokens";

const ROLE_COLOR = { admin: T.blue, teacher: "#a855f7", student: T.mint };

function SectionHeader({ children }) {
  return (
    <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 4, marginTop: 28 }}>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${T.ink3}` }}>
      <div>
        <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{description}</div>}
      </div>
      <div onClick={onChange} style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? T.blue : T.ink3, border: `2px solid ${value ? T.blue : T.ink4}`,
        position: "relative", transition: "all 0.2s", cursor: "pointer", flexShrink: 0, marginLeft: 16,
      }}>
        <div style={{
          position: "absolute", top: 2, left: value ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: "white", transition: "left 0.2s",
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

function InfoRow({ label, value, badge }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${T.ink3}` }}>
      <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {badge && (
          <span style={{
            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
            background: badge.bg, color: badge.color, border: `1px solid ${badge.color}30`,
          }}>{badge.text}</span>
        )}
        {value && <span style={{ fontSize: 12, color: T.muted }}>{value}</span>}
      </div>
    </div>
  );
}

export default function SettingsScreen({ user, setScreen }) {
  const roleColor = ROLE_COLOR[user?.role] || T.blue;
  const backScreen = user?.role === "student" ? "studentDash" : user?.role === "teacher" ? "teacherDash" : "adminDash";

  // Notification prefs
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

  // Exam / proctoring
  const [autoSubmit,        setAutoSubmit]        = useState(true);
  const [tabWarnings,       setTabWarnings]       = useState(true);
  const [faceDetection,     setFaceDetection]     = useState(true);
  const [defaultStrictness, setDefaultStrictness] = useState("moderate");

  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink, overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{
        height: 56, background: "#0c0b18", borderBottom: `1px solid ${T.ink3}`,
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
        <button onClick={handleSave} style={{
          padding: "7px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: saved ? T.mint + "20" : T.blue,
          border: saved ? `1px solid ${T.mint}40` : "none",
          color: saved ? T.mint : "white", cursor: "pointer",
          fontFamily: "'Sora', system-ui, sans-serif", transition: "all 0.2s",
        }}>
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
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
              <div style={{ ...mono, fontSize: 11, color: T.muted }}>{user?.email}</div>
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
          <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "0 20px" }}>
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
                { value: "Asia/Kolkata",    label: "IST — India Standard Time"    },
                { value: "America/New_York", label: "EST — Eastern Standard Time" },
                { value: "Europe/London",   label: "GMT — Greenwich Mean Time"    },
                { value: "Asia/Singapore",  label: "SGT — Singapore Time"         },
              ]}
            />
          </div>

          {/* ── Proctoring (admin/teacher only) ── */}
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

          {/* ── Security ── */}
          <SectionHeader>Security</SectionHeader>
          <div style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "0 20px" }}>
            <InfoRow label="Password" value="Last changed 2 weeks ago" />
            <InfoRow label="Two-Factor Authentication" badge={{ text: "Enabled", color: T.mint, bg: T.mint + "18" }} />
            <InfoRow label="Login Sessions" value="1 active session" />
            <InfoRow label="Trusted Devices" value="2 devices" />
          </div>

          {/* ── Danger zone ── */}
          <SectionHeader>Danger Zone</SectionHeader>
          <div style={{ background: T.ink2, border: `1px solid ${T.pink}30`, borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: T.ghost, fontWeight: 500 }}>Delete Account</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Permanently remove your account and all data</div>
              </div>
              <button style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: T.pink + "18", border: `1px solid ${T.pink}40`,
                color: T.pink, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif",
              }}>
                Delete Account
              </button>
            </div>
          </div>

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}
