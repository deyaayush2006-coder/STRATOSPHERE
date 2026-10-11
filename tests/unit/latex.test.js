import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { hasMath, mathBlocks, splitMath } from "@/lib/latex";
import RichText from "@/components/RichText";

const types = (text) => splitMath(text).map((s) => [s.type, s.value]);
const html = (text) => renderToStaticMarkup(createElement(RichText, { text }));

describe("splitMath", () => {
  it("finds inline math in $...$ and \\(...\\)", () => {
    expect(types("Energy $E = mc^2$ and \\(F = ma\\).")).toEqual([
      ["text", "Energy "],
      ["inline", "E = mc^2"],
      ["text", " and "],
      ["inline", "F = ma"],
      ["text", "."],
    ]);
  });

  it("finds display math in $$...$$, \\[...\\] and equation environments", () => {
    expect(types("$$\\int_0^1 x\\,dx$$")).toEqual([["display", "\\int_0^1 x\\,dx"]]);
    expect(types("\\[ a^2 + b^2 = c^2 \\]")).toEqual([["display", "a^2 + b^2 = c^2"]]);
    const env = "\\begin{align*}\n  x &= 1 \\\\\n  y &= 2\n\\end{align*}";
    expect(types(`Then ${env} holds.`)).toEqual([
      ["text", "Then "],
      ["display", env],
      ["text", " holds."],
    ]);
  });

  it("leaves prices and escaped dollars as text", () => {
    expect(hasMath("Tickets cost $5 and $10.")).toBe(false);
    expect(hasMath("Budget: $ 200 to $ 300")).toBe(false);
    expect(types("A \\$5 fee")).toEqual([["text", "A $5 fee"]]);
    expect(types("$x$5")).toEqual([["text", "$x$5"]]);
    expect(types("Motors cost $45 each, or \\$40 in bulk; thrust $T$.")).toEqual([
      ["text", "Motors cost $45 each, or $40 in bulk; thrust "],
      ["inline", "T"],
      ["text", "."],
    ]);
  });

  it("does not let an unclosed delimiter swallow the rest of the text", () => {
    expect(hasMath("Opening $x but never closed\n\nNext paragraph $y$")).toBe(true);
    expect(types("Opening $x but never closed\n\nNext $y$")[0]).toEqual([
      "text",
      "Opening $x but never closed\n\nNext ",
    ]);
    expect(hasMath("\\[ no end")).toBe(false);
    expect(hasMath("\\begin{equation} x = 1")).toBe(false);
  });

  it("keeps escaped dollars inside inline math", () => {
    expect(types("$\\$5 + x$")).toEqual([["inline", "\\$5 + x"]]);
  });
});

describe("mathBlocks", () => {
  it("splits paragraphs on blank lines and puts display math on its own", () => {
    const blocks = mathBlocks("First $a$ para.\n\nSecond para:\n$$b$$\nafter.");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "paragraph", "display", "paragraph"]);
    expect(blocks[0].children.map((c) => c.type)).toEqual(["text", "inline", "text"]);
    expect(blocks[3].children).toEqual([{ type: "text", value: "after." }]);
  });

  it("keeps a display equation whole even with a blank line inside it", () => {
    const blocks = mathBlocks("$$\na\n\nb\n$$");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("display");
  });

  it("returns nothing for empty input", () => {
    expect(mathBlocks("")).toEqual([]);
    expect(mathBlocks(undefined)).toEqual([]);
  });
});

describe("RichText", () => {
  it("renders inline and display math with KaTeX, with MathML for screen readers", () => {
    const out = html("Mass–energy $E = mc^2$.\n\n$$\\frac{a}{b}$$");
    expect(out).toContain('<span class="katex">');
    expect(out).toContain('class="katex-display"');
    expect(out).toContain("<math");
    expect(out).toContain('class="math-display ');
  });

  it("escapes the text around the math", () => {
    const out = html("<script>alert(1)</script> and $x$");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("refuses links and raw HTML inside math", () => {
    const out = html("$\\href{javascript:alert(1)}{x}$ $\\htmlClass{evil}{y}$");
    expect(out).not.toMatch(/href=/);
    expect(out).not.toContain('class="evil"');
    expect(out).toContain('color:#cc0000'); // shown as an error, not obeyed
  });

  it("shows a LaTeX typo as red source text instead of throwing", () => {
    expect(() => html("$\\frac{a}{$")).not.toThrow();
    expect(html("$\\frac{a}{$")).toContain("katex-error");
  });

  it("renders text without math exactly as paragraphs", () => {
    expect(html("One.\n\nTwo.")).toBe("<p class=\"\">One.</p><p class=\"\">Two.</p>");
  });
});
