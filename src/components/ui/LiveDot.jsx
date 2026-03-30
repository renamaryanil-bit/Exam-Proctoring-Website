import { T } from "../../data/tokens";

export default function LiveDot({ color = T.mint }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%", background: color,
      display: "inline-block", animation: "pulse 1.2s ease infinite", flexShrink: 0,
    }} />
  );
}
