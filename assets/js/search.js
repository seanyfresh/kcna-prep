/* Lightweight client-side search across notes, glossary, and domains.
   Builds an in-memory index on first use. No dependencies. */
window.Search = (function () {
  let index = null;

  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function build() {
    const items = [];
    if (!window.KCNA || !KCNA.ready()) return items;

    KCNA.all().forEach((d) => {
      items.push({
        type: 'Domain', title: d.name, sub: d.weight + '% of exam',
        text: (d.name + ' ' + (d.notes || []).map((n) => n.title).join(' ')).toLowerCase(),
        route: '#/learn/' + d.id, body: '',
      });
      (d.notes || []).forEach((n, i) => {
        const body = stripHtml(n.html);
        items.push({
          type: 'Note', title: n.title, sub: d.name,
          text: (n.title + ' ' + (n.topic || '') + ' ' + body).toLowerCase(),
          route: '#/note/' + d.id + '/' + i, body,
        });
      });
    });

    if (KCNA.hasGlossary && KCNA.hasGlossary()) {
      KCNA.glossary().forEach((g) => {
        items.push({
          type: 'Glossary', title: g.term, sub: 'Glossary',
          text: (g.term + ' ' + g.definition).toLowerCase(),
          route: '#/reference?term=' + encodeURIComponent(g.term), body: g.definition,
        });
      });
    }
    return items;
  }

  function ensure() { if (!index) index = build(); return index; }

  function snippet(body, terms) {
    if (!body) return '';
    const low = body.toLowerCase();
    let at = -1;
    for (const t of terms) { const p = low.indexOf(t); if (p >= 0) { at = p; break; } }
    if (at < 0) return body.slice(0, 120) + (body.length > 120 ? '…' : '');
    const start = Math.max(0, at - 40);
    return (start > 0 ? '…' : '') + body.slice(start, start + 140).trim() + '…';
  }

  function query(q, limit) {
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    const typeBoost = { Domain: 3, Glossary: 2, Note: 1 };
    const out = [];
    ensure().forEach((it) => {
      let score = 0;
      terms.forEach((t) => {
        if (it.title.toLowerCase().indexOf(t) >= 0) score += 6;
        let from = 0, idx;
        while ((idx = it.text.indexOf(t, from)) >= 0) { score += 1; from = idx + t.length; if (score > 50) break; }
      });
      if (score > 0) {
        score += typeBoost[it.type] || 0;
        out.push({ type: it.type, title: it.title, sub: it.sub, route: it.route, snippet: snippet(it.body, terms), score });
      }
    });
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, limit || 12);
  }

  function reset() { index = null; }

  return { query, reset };
})();
