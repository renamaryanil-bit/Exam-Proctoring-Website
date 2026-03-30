import { serif } from "../../data/tokens";

export default function Serif({ children, style, ...rest }) {
  return (
    <span style={{ ...serif, ...style }} {...rest}>
      {children}
    </span>
  );
}
