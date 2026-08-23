// JSON.stringify does not escape "<", so a value containing the literal
// string "</script>" would close the surrounding <script type="application/
// ld+json"> tag early and let whatever follows be parsed as HTML/JS. Some of
// the JSON-LD blocks on the site embed data that ultimately traces back to
// external content (e.g. imported Facebook post captions), so stringify
// through this helper instead of JSON.stringify directly whenever the
// result gets passed to dangerouslySetInnerHTML. `<` is valid inside a
// JSON string and decodes back to "<" for any real JSON-LD consumer.
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
