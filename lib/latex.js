// Finds the LaTeX math in plain text, the way it is written in Overleaf:
//
//   inline:   $E = mc^2$   \(E = mc^2\)
//   display:  $$ ... $$    \[ ... \]    \begin{equation} ... \end{equation}
//             (also equation*, align, align*, alignat, alignat*, gather, gather*)
//
// A single $ only opens math when a non-space character follows it, and only
// closes it when a non-space character precedes it and no digit follows, so
// "costs $5 and $10" stays text. Write \$ for a literal dollar sign. Inline
// math never runs across a blank line, and an unclosed delimiter is left as
// text rather than swallowing the rest of the write-up.

const ENVIRONMENTS = /^\\begin\{((?:equation|align|alignat|gather)\*?)\}/;

const isSpace = (ch) => ch === undefined || /\s/.test(ch);
const isDigit = (ch) => ch !== undefined && ch >= "0" && ch <= "9";
const hasBlankLine = (s) => /\n[ \t]*\n/.test(s);

// Closing $ for an inline $ opened at `open`, or -1. Inline math ends at the
// next unescaped $; if that one can't close it, the opening $ was a plain
// dollar sign ("$45 each ... $x$" must not turn the sentence into math).
function closingDollar(src, open) {
  for (let k = open + 1; k < src.length; k++) {
    if (src[k] === "\n" && /^\n[ \t]*\n/.test(src.slice(k))) return -1;
    if (src[k] === "\\") {
      k++;
      continue;
    }
    if (src[k] === "$") return !isSpace(src[k - 1]) && !isDigit(src[k + 1]) ? k : -1;
  }
  return -1;
}

/**
 * Splits text into segments: { type: "text" | "inline" | "display", value }.
 * For math segments, `value` is the TeX to hand to the renderer.
 */
export function splitMath(input) {
  const src = String(input ?? "");
  const out = [];
  let text = "";

  const flush = () => {
    if (text) out.push({ type: "text", value: text });
    text = "";
  };
  const math = (type, value) => {
    flush();
    out.push({ type, value: value.trim() });
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === "\\") {
      const next = src[i + 1];

      if (next === "$") {
        text += "$";
        i += 2;
        continue;
      }

      if (next === "[") {
        const end = src.indexOf("\\]", i + 2);
        if (end !== -1 && src.slice(i + 2, end).trim()) {
          math("display", src.slice(i + 2, end));
          i = end + 2;
          continue;
        }
      }

      if (next === "(") {
        const end = src.indexOf("\\)", i + 2);
        const body = end === -1 ? "" : src.slice(i + 2, end);
        if (body.trim() && !hasBlankLine(body)) {
          math("inline", body);
          i = end + 2;
          continue;
        }
      }

      const env = ENVIRONMENTS.exec(src.slice(i));
      if (env) {
        const close = `\\end{${env[1]}}`;
        const end = src.indexOf(close, i);
        if (end !== -1) {
          math("display", src.slice(i, end + close.length));
          i = end + close.length;
          continue;
        }
      }

      // Any other backslash is ordinary text; keep the next character with it
      // so "\\" can't escape what follows.
      text += next === undefined ? ch : ch + next;
      i += 2;
      continue;
    }

    if (ch === "$") {
      if (src[i + 1] === "$") {
        const end = src.indexOf("$$", i + 2);
        if (end !== -1 && src.slice(i + 2, end).trim()) {
          math("display", src.slice(i + 2, end));
          i = end + 2;
          continue;
        }
      } else if (!isSpace(src[i + 1])) {
        const end = closingDollar(src, i);
        if (end !== -1) {
          math("inline", src.slice(i + 1, end));
          i = end + 1;
          continue;
        }
      }
    }

    text += ch;
    i++;
  }

  flush();
  return out;
}

/** True when the text contains anything splitMath would render as math. */
export function hasMath(input) {
  return splitMath(input).some((s) => s.type !== "text");
}

/**
 * Groups segments into blocks for rendering: paragraphs (split on blank
 * lines, holding text and inline math) and display equations on their own.
 */
export function mathBlocks(input) {
  const blocks = [];
  let para = [];

  const endParagraph = () => {
    const trimmed = trimParagraph(para);
    if (trimmed.length) blocks.push({ type: "paragraph", children: trimmed });
    para = [];
  };

  for (const seg of splitMath(input)) {
    if (seg.type === "display") {
      endParagraph();
      blocks.push(seg);
    } else if (seg.type === "inline") {
      para.push(seg);
    } else {
      const pieces = seg.value.split(/\n[ \t]*\n/);
      pieces.forEach((piece, n) => {
        if (n > 0) endParagraph();
        if (piece) para.push({ type: "text", value: piece });
      });
    }
  }
  endParagraph();
  return blocks;
}

function trimParagraph(children) {
  const out = children.slice();
  if (out[0]?.type === "text") out[0] = { ...out[0], value: out[0].value.replace(/^\s+/, "") };
  const last = out.length - 1;
  if (out[last]?.type === "text") out[last] = { ...out[last], value: out[last].value.replace(/\s+$/, "") };
  return out.filter((c) => c.type !== "text" || c.value);
}
