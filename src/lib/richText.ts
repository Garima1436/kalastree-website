// Plain-text excerpt from TipTap-authored HTML — used for card previews
// where only a few lines of text (no markup) should show.
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const WORDS_PER_MINUTE = 200

// Rounded up, minimum 1 minute — matches the "X min read" convention
// readers expect (a 30-second note still reads as "1 min read", not "0").
export function estimateReadTime(html: string): number {
  const words = stripHtml(html).split(' ').filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
