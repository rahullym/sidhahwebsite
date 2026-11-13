/**
 * Turns a blog post typed in the dashboard into HTML. Deliberately tiny: blank
 * lines separate paragraphs, "## " / "### " start headings, "- " starts a
 * bullet, **bold**, and [text](https://link). Everything is escaped first, so
 * nothing staff type can inject markup or script into the public site.
 */
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(text: string): string {
  return escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Only http(s) and mailto links: a javascript: URL would run on click.
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

export function renderBody(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const heading = /^(#{2,3})\s+(.*)$/.exec(block);
      if (heading && !block.includes('\n')) {
        const level = heading[1]!.length;
        return `<h${level}>${inline(heading[2]!)}</h${level}>`;
      }
      const rows = block.split('\n');
      if (rows.every((r) => /^\s*[-*]\s+/.test(r))) {
        return `<ul>${rows.map((r) => `<li>${inline(r.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${rows.map(inline).join('<br>')}</p>`;
    })
    .join('\n');
}
