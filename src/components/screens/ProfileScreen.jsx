import { useState } from "react";
import { T, serif, mono } from "../../data/tokens";
import { userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Btn from "../ui/Btn";

const ROLE_META = {
  admin:   { color: T.blue,  grad: `linear-gradient(135deg, ${T.blue}, #7b6cff)` },
  teacher: { color: "#a855f7", grad: "linear-gradient(135deg, #a855f7, #7b3fcf)" },
  student: { color: T.mint, grad: `linear-gradient(135deg, ${T.mint}, #00a07a)` },
};

export default function ProfileScreen({ user, setScreen }) {
  const { updateUserName } = useAuth();
  const meta = ROLE_META[user?.role] || ROLE_META.admin;
  const [editName, setEditName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const backScreen = user?.role === "student" ? "studentDash" : user?.role === "teacher" ? "teacherDash" : "adminDash";

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await userAPI.updateMe(displayName);
      updateUserName(displayName); // update context + localStorage
      setEditName(false);
    } catch (err) {
      alert("Could not save name: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.ink, overflow: "hidden" }}>
      <div style={{ height: 56, background: "#0c0b18", borderBottom: `1px solid ${T.ink3}`, display: "flex", alignItems: "center", gap: 16, padding: "0 24px", flexShrink: 0 }}>
        <button onClick={() => setScreen(backScreen)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>←</button>
        <div style={{ ...serif, fontSize: 18, color: T.ghost }}>Profile</div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "36px 28px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Hero card */}
          <div className="fade-in" style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 20, padding: "32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: meta.color + "15", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 24, position: "relative" }}>
              {/* Avatar */}
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: meta.grad, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "white", fontWeight: 700, boxShadow: `0 0 0 4px ${meta.color}25` }}>
                {user?.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editName ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      autoFocus
                      style={{ fontSize: 22, fontWeight: 600, color: T.ghost, background: T.ink3, border: `1.5px solid ${meta.color}60`, borderRadius: 8, padding: "6px 12px", fontFamily: "'Sora', system-ui, sans-serif", outline: "none" }}
                    />
                    <Btn variant="primary" onClick={handleSaveName} disabled={saving} style={{ padding: "6px 14px", fontSize: 12 }}>{saving ? "…" : "Save"}</Btn>
                    <Btn variant="ghost" onClick={() => { setEditName(false); setDisplayName(user?.name || ""); }} style={{ padding: "6px 14px", fontSize: 12 }}>Cancel</Btn>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h1 style={{ ...serif, fontSize: 26, color: T.ghost }}>{displayName}</h1>
                    <button onClick={() => setEditName(true)} style={{ background: "none", border: `1px solid ${T.ink4}`, borderRadius: 6, color: T.muted, fontSize: 11, padding: "3px 8px", cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}>Edit</button>
                  </div>
                )}
                <div style={{ ...mono, fontSize: 12, color: T.muted, marginBottom: 12 }}>@{user?.username}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: meta.color + "18", border: `1px solid ${meta.color}30`, fontSize: 11, fontWeight: 600, color: meta.color, textTransform: "capitalize" }}>
                  {user?.role}
                </div>
              </div>
              <div style={{ ...mono, fontSize: 10, color: T.muted, textAlign: "right", flexShrink: 0 }}>
                <div>ProctorOS University</div>
                <div style={{ marginTop: 4 }}>Last active: now</div>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="fade-in" style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px", marginBottom: 16 }}>
            <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 16 }}>
              Account Information
            </div>
            {[
              ["Full Name",  displayName],
              ["Username",   user?.username],
              ["Role",       user?.role],
              ["User ID",    user?.id],
              ["Institution","ProctorOS University"],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.ink3}` }}>
                <span style={{ fontSize: 12, color: T.muted }}>{l}</span>
                <span style={{ fontSize: 12, color: T.ghost, fontWeight: 500, textTransform: l === "Role" ? "capitalize" : "none" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Recent activity — static */}
          <div className="fade-in" style={{ background: T.ink2, border: `1px solid ${T.ink3}`, borderRadius: 16, padding: "22px" }}>
            <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, marginBottom: 16 }}>
              Recent Activity
            </div>
            {[
              { icon: "✅", text: "Signed in successfully",   time: "Just now",   color: T.mint },
              { icon: "🎓", text: "Account active",            time: "Since setup", color: T.blue },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: i < 1 ? `1px solid ${T.ink3}` : "none" }}>
                <span style={{ fontSize: 14 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.ghost }}>{a.text}</div>
                  <div style={{ ...mono, fontSize: 10, color: T.muted, marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
