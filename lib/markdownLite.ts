// lib/markdownLite.ts
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(raw: string) {
  let s = escapeHtml(raw);
  // images: ![alt](https://...)
  s = s.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />'
  );
  // links: [text](https://... | mailto: | /path)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|\/[^\s)]*)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#3FA637;text-decoration:underline">$1</a>'
  );
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

export function renderMarkdownLite(md: string): string {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushPara(); flushList(); continue; }

    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) {
      flushPara(); flushList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }

    const li = /^[-*]\s+(.*)$/.exec(t);
    if (li) { flushPara(); list.push(li[1]); continue; }

    flushList();
    para.push(t);
  }
  flushPara(); flushList();
  return out.join("\n");
}