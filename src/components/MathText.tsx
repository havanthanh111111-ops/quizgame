import React, { useEffect, useRef } from "react";

interface MathTextProps {
  text: string;
  className?: string;
  isBlock?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = "", isBlock = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset container contents safely
    containerRef.current.innerHTML = "";

    // Access global katex from CDN
    const katex = (window as any).katex;

    if (!katex) {
      // Fallback to raw text if KaTeX is not loaded yet
      containerRef.current.textContent = text;
      return;
    }

    if (isBlock) {
      try {
        const span = document.createElement("span");
        span.className = "block my-2 overflow-x-auto text-center";
        katex.render(text, span, { displayMode: true, throwOnError: false });
        containerRef.current.appendChild(span);
      } catch (err) {
        containerRef.current.textContent = text;
      }
      return;
    }

    // Split text by display math ($$...$$) and inline math ($...$)
    // e.g. "Tính giá trị của $\lambda$ khi $f = 50$ Hz"
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);

    parts.forEach((part) => {
      if (!part) return;

      if (part.startsWith("$$") && part.endsWith("$$")) {
        const formula = part.slice(2, -2);
        try {
          const span = document.createElement("span");
          span.className = "block my-2 overflow-x-auto text-center";
          katex.render(formula, span, { displayMode: true, throwOnError: false });
          containerRef.current?.appendChild(span);
        } catch (e) {
          const span = document.createElement("span");
          span.textContent = part;
          containerRef.current?.appendChild(span);
        }
      } else if (part.startsWith("$") && part.endsWith("$")) {
        const formula = part.slice(1, -1);
        try {
          const span = document.createElement("span");
          span.className = "inline-block mx-1 align-middle";
          katex.render(formula, span, { displayMode: false, throwOnError: false });
          containerRef.current?.appendChild(span);
        } catch (e) {
          const span = document.createElement("span");
          span.textContent = part;
          containerRef.current?.appendChild(span);
        }
      } else {
        const textSpan = document.createElement("span");
        textSpan.textContent = part;
        containerRef.current?.appendChild(textSpan);
      }
    });
  }, [text, isBlock]);

  return <span ref={containerRef} className={className} />;
};

export default MathText;
