import { useEffect } from "react";

// Signature interaction: updates CSS vars for radial light fields
export default function MagicalGradient() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = `${e.clientX}px`;
      const y = `${e.clientY}px`;
      document.body.style.setProperty("--mx", x);
      document.body.style.setProperty("--my", y);
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, []);
  return null;
}
