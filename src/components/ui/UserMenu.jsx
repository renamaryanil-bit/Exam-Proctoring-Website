import { useState, useRef, useEffect } from "react";
import { T, serif, mono } from "../../data/tokens";

const MENU_ITEMS = [
  { icon: "👤", label: "Profile",  key: "profile"  },
  { icon: "⚙️", label: "Settings", key: "settings" },
];

export default function UserMenu({ user, onLogout, setScreen }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov]   = useState(null);
  const ref             = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roleColor = { admin: T.blue, teacher: T.purple, student: T.mint }[user?.role] || T.blue;
  const roleGrad  = {
    admin:   `linear-gradient(135deg, ${T.blue}, #7b6cff)`,
    teacher: `linear-gradient(135deg, ${T.purple}, #7b3fcf)`,
    student: `linear-gradient(135deg, ${T.mint}, #00a07a)`,
  }[user?.role] || `linear-gradient(135deg, ${T.blue}, #7b6cff)`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Avatar trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 32, height: 32, borderRadius: "50%",
          background: roleGrad,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: "white", fontWeight: 600, flexShrink: 0,
          cursor: "pointer",
          outline: open ? `2px solid ${roleColor}60` : "2px solid transparent",
          outlineOffset: 2,
          transition: "outline 0.15s",
        }}
      >
        {user?.initials}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="fade-in" style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: 220, borderRadius: 14, overflow: "hidden",
          background: "#0c0b18", border: `1px solid ${T.ink3}`,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          zIndex: 10000,
        }}>
          {/* Profile header */}
          <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${T.ink3}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: roleGrad,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: "white", fontWeight: 700, flexShrink: 0,
              }}>
                {user?.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ghost, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.name}
                </div>
                <div style={{ ...mono, fontSize: 10, color: T.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <div style={{
              marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
              padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
              color: roleColor, background: roleColor + "18", border: `1px solid ${roleColor}30`,
            }}>
              <span style={{ textTransform: "capitalize" }}>{user?.role}</span>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "6px 0" }}>
            {MENU_ITEMS.map(item => (
              <button
                key={item.key}
                onMouseEnter={() => setHov(item.key)}
                onMouseLeave={() => setHov(null)}
                onClick={() => { setOpen(false); setScreen && setScreen(item.key); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", background: hov === item.key ? T.ink3 : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  color: T.ghost, fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif",
                  transition: "background 0.12s",
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: T.ink3, margin: "4px 0" }} />

            {/* Logout */}
            <button
              onMouseEnter={() => setHov("logout")}
              onMouseLeave={() => setHov(null)}
              onClick={() => { setOpen(false); onLogout(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", background: hov === "logout" ? T.pink + "18" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                color: hov === "logout" ? T.pink : T.muted,
                fontSize: 13, fontFamily: "'Sora', system-ui, sans-serif",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: 15 }}>🚪</span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
