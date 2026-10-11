import katex from "katex";
import "katex/dist/katex.min.css";
import { mathBlocks } from "@/lib/latex";

// Paragraphs of plain text with LaTeX math, rendered by KaTeX to HTML (plus
// MathML for screen readers). Works on the server and in the browser, so the
// public pages ship no math JavaScript and Control Tower can preview with the
// same code. See lib/latex.js for the syntax.

const OPTIONS = {
  throwOnError: false, // a typo shows the source in red instead of breaking the page
  strict: "ignore",
  trust: false, // no \href, \includegraphics or raw HTML from content
  output: "htmlAndMathml",
};

export function renderMath(tex, displayMode) {
  return katex.renderToString(tex, { ...OPTIONS, displayMode });
}

export default function RichText({ text, paragraphClassName = "", displayClassName = "" }) {
  return mathBlocks(text).map((block, b) =>
    block.type === "display" ? (
      <div
        key={b}
        className={`math-display ${displayClassName}`}
        dangerouslySetInnerHTML={{ __html: renderMath(block.value, true) }}
      />
    ) : (
      <p key={b} className={paragraphClassName}>
        {block.children.map((child, c) =>
          child.type === "inline" ? (
            <span key={c} dangerouslySetInnerHTML={{ __html: renderMath(child.value, false) }} />
          ) : (
            child.value
          )
        )}
      </p>
    )
  );
}
