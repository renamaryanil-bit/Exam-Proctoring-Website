import { T } from "../../data/tokens";

export default function Badge({ children, color = T.blue, bg = T.blueLight, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, color, background: bg,
      border: `1px solid ${color}30`,
      ...style,
    }}>
      {children}
    </span>
  );
}
