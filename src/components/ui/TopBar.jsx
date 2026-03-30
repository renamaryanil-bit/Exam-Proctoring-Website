import { useState } from "react";
import { T, serif, mono } from "../../data/tokens";
import UserMenu from "../ui/UserMenu";

export default function TopBar({ user, setScreen, currentScreen, navItems, onLogout }) {
  return (
    <div style={{
      height: 56, background: "#0c0b18",
      borderBottom: `1px solid ${T.ink3}`,
      display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 24px",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ ...serif, fontSize: 18, color: T.paper, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, display: "inline-block" }} />
          ProctorOS
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setScreen(item.key)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                background: currentScreen === item.key ? T.ink3 : "transparent",
                color: currentScreen === item.key ? T.ghost : T.muted,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                fontFamily: "'Sora', system-ui, sans-serif",
              }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ ...mono, fontSize: 10, color: T.ink4 }}>
          {new Date().toDateString()}
        </div>
        <UserMenu user={user} onLogout={onLogout} setScreen={setScreen} />
      </div>
    </div>
  );
}
