import { describe, it, expect } from 'vitest'
import { stripHtml, estimateReadTime } from './richText'

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })

  it('handles nested/multiple block elements', () => {
    expect(stripHtml('<h2>Title</h2><p>First.</p><p>Second.</p>')).toBe('Title First. Second.')
  })

  it('returns empty string for empty/whitespace-only HTML', () => {
    expect(stripHtml('<p></p>')).toBe('')
    expect(stripHtml('  ')).toBe('')
  })
})

describe('estimateReadTime', () => {
  it('rounds up and never returns less than 1 minute', () => {
    expect(estimateReadTime('<p>Just a few words here.</p>')).toBe(1)
  })

  it('estimates roughly words / 200 rounded up', () => {
    const words = Array(450).fill('word').join(' ')
    expect(estimateReadTime(`<p>${words}</p>`)).toBe(3) // 450/200 = 2.25 -> 3
  })
})
