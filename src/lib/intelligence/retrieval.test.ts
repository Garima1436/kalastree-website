import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retrieveNarrativeEvidence, warmUpChatbotBackend } from './retrieval'

describe('narrative retrieval backend cooldown', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does not call the network for intents that do not need narrative evidence', async () => {
    const result = await retrieveNarrativeEvidence('Show me sarees', ['product_discovery'])
    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches narrative chunks for a narrative-needing intent', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chunks: [{ content: 'x', source: 'y', score: 0.9 }] }),
    })
    const result = await retrieveNarrativeEvidence('What is GI?', ['gi_information'])
    expect(result).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('enters a cooldown after a failed call, skipping the network on the next attempt, then resumes once it expires', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'))
    const first = await retrieveNarrativeEvidence('Tell me about Madhubani', ['craft_information'])
    expect(first).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Still within the cooldown window — skips the network entirely.
    const second = await retrieveNarrativeEvidence('Tell me about Pashmina', ['craft_information'])
    expect(second).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(warmUpChatbotBackend()).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1) // warm-up is also a no-op during cooldown

    // Cooldown expired — the next call tries the network again.
    vi.advanceTimersByTime(21000)
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ chunks: [] }) })
    const third = await retrieveNarrativeEvidence('Tell me about Bhagalpur Silk', ['craft_information'])
    expect(third).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('clears the cooldown after a subsequent success', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'))
    await retrieveNarrativeEvidence('a', ['craft_information'])
    vi.advanceTimersByTime(21000)

    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ chunks: [] }) })
    await retrieveNarrativeEvidence('b', ['craft_information'])

    // Cooldown was cleared by the success above, so this next call — well
    // within what would have been the old cooldown window — still hits the
    // network instead of being skipped.
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ chunks: [] }) })
    await retrieveNarrativeEvidence('c', ['craft_information'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
