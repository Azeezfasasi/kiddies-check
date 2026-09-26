import React, { Fragment } from "react";

/**
 * Renders the small Markdown subset the assistant uses (bold, inline code,
 * "- " / "1. " lists, "|" tables, "#" headings, paragraphs) as React
 * elements. No HTML is injected, so model output cannot run markup.
 */

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key} className="px-1 py-0.5 rounded bg-gray-100 text-[0.85em]">{part.slice(1, -1)}</code>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isDivider = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export default function ChatMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;

    // Blank lines and horizontal rules (---, ***) just separate blocks.
    if (!line.trim() || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      i++;
      continue;
    }

    if (isTableRow(line)) {
      const rows: string[] = [];
      while (i < lines.length && (isTableRow(lines[i]) || isDivider(lines[i]))) {
        if (!isDivider(lines[i])) rows.push(lines[i]);
        i++;
      }
      const [head, ...body] = rows.map(cells);
      blocks.push(
        <div key={key} className="overflow-x-auto my-2">
          <table className="min-w-full text-xs border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>{head.map((c, j) => <th key={j} className="px-2 py-1 text-left font-semibold border-b border-gray-200">{inline(c, `${key}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-b border-gray-100 last:border-0">
                  {r.map((c, j) => <td key={j} className="px-2 py-1 align-top">{inline(c, `${key}r${ri}c${j}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
        i++;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={key} className={`my-1.5 pl-5 space-y-0.5 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((it, j) => <li key={j}>{inline(it, `${key}l${j}`)}</li>)}
        </ListTag>
      );
      continue;
    }

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) {
      blocks.push(<p key={key} className="font-semibold mt-2 mb-1">{inline(heading[1], key)}</p>);
      i++;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isTableRow(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i]) && !/^\s*#{1,6}\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key} className="my-1.5">
        {para.map((p, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(p, `${key}p${j}`)}
          </Fragment>
        ))}
      </p>
    );
  }

  return <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{blocks}</div>;
}
