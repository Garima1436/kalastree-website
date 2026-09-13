import { describe, it, expect } from 'vitest'
import { getVideoEmbedUrl, isDirectVideoUrl } from './videoEmbed'

describe('getVideoEmbedUrl', () => {
  it('converts a YouTube watch URL', () => {
    expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('converts a youtu.be short URL', () => {
    expect(getVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('converts a YouTube Shorts URL', () => {
    expect(getVideoEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('converts a Vimeo URL', () => {
    expect(getVideoEmbedUrl('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
  })

  it('returns null for a direct video file URL', () => {
    expect(getVideoEmbedUrl('https://example.com/clip.mp4')).toBeNull()
  })

  it('returns null for an unrelated URL', () => {
    expect(getVideoEmbedUrl('https://example.com')).toBeNull()
  })

  it('returns null for a malformed URL instead of throwing', () => {
    expect(getVideoEmbedUrl('not a url')).toBeNull()
  })
})

describe('isDirectVideoUrl', () => {
  it('recognizes common direct video file extensions', () => {
    expect(isDirectVideoUrl('https://xyz.supabase.co/storage/v1/object/public/news-events/1234-clip.mp4')).toBe(true)
    expect(isDirectVideoUrl('https://example.com/video.webm')).toBe(true)
    expect(isDirectVideoUrl('https://example.com/video.mov')).toBe(true)
  })

  it('is false for a YouTube/Vimeo URL', () => {
    expect(isDirectVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false)
    expect(isDirectVideoUrl('https://vimeo.com/76979871')).toBe(false)
  })

  it('is false for a non-video URL', () => {
    expect(isDirectVideoUrl('https://example.com/page')).toBe(false)
  })

  it('is false for a malformed URL instead of throwing', () => {
    expect(isDirectVideoUrl('not a url')).toBe(false)
  })
})
