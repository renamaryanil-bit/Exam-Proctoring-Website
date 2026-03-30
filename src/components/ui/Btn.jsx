import { useState } from "react";
import { T } from "../../data/tokens";

const VARIANTS = {
  primary:          { bg: T.blue,      color: "white",    border: `1px solid ${T.blue}`,         hoverBg: "#1c33e8"  },
  secondary:        { bg: "transparent", color: T.paper,  border: `1px solid ${T.ink4}`,         hoverBg: T.ink3     },
  danger:           { bg: T.pinkLight, color: T.pink,     border: `1px solid ${T.pink}40`,       hoverBg: "#ffe0e9"  },
  warn:             { bg: T.amberLight, color: "#b07a10", border: `1px solid ${T.amber}40`,      hoverBg: "#fff0d4"  },
  ghost:            { bg: "transparent", color: T.dim,    border: `1px solid ${T.ink4}`,         hoverBg: T.ink3     },
  mint:             { bg: T.mintLight, color: "#087050",  border: `1px solid ${T.mint}40`,       hoverBg: "#d0f5e8"  },
  "light-secondary":{ bg: "transparent", color: T.ink2,  border: `1px solid ${T.paper3}`,       hoverBg: T.paper2   },
  "light-primary":  { bg: T.blue,      color: "white",    border: `1px solid ${T.blue}`,         hoverBg: "#1c33e8"  },
};

export default function Btn({ children, variant = "primary", onClick, style, disabled }) {
  const [hov, setHov] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
        background: hov ? v.hoverBg : v.bg, color: v.color, border: v.border,
        transition: "all 0.15s", transform: hov ? "translateY(-1px)" : "none",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex", alignItems: "center", gap: 6,
        fontFamily: "'Sora', system-ui, sans-serif", cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
