// Turns a YouTube/Vimeo watch URL into an embeddable iframe src. Returns
// null for anything else (direct video file URLs, unrecognized links) —
// callers should fall back to a plain "Watch video" link in that case
// rather than guessing at an embed for an untrusted URL shape.
export function getVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    return null
  }
  return null
}

const VIDEO_FILE_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)$/i

// True for a direct video file URL (e.g. an admin-uploaded file in
// Supabase Storage) — these render as an inline <video> player rather
// than an iframe embed or a plain link.
export function isDirectVideoUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return VIDEO_FILE_EXTENSIONS.test(u.pathname)
  } catch {
    return false
  }
}
