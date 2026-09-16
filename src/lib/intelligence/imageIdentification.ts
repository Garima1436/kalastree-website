// Image-based product identification: a user uploads a photo and asks
// "what GI product is this / where is it from?". Vision-identifies a
// CRAFT NAME GUESS from the image (a real capability of gpt-4o-mini), but
// that guess is NEVER stated to the user as fact on its own — it is only
// ever used as a search term against the real GI registry
// (resolveGIProduct) and the real marketplace, exactly like a typed craft
// name would be. If the guess doesn't match anything real, the pipeline
// says so honestly rather than presenting an unverified vision guess as a
// confirmed GI/state/marketplace fact.
import { callOpenAIVision } from './openai'

export interface ImageIdentification {
  craftGuess: string | null
  visualDescription: string
  // A plain, generic object/material descriptor (e.g. "leather horse
  // figurine", "blue ceramic vase") — always populated, even when craftGuess
  // is NONE. Naming a specific GI craft by memory alone is a much higher
  // bar than describing what's plainly visible in the photo (a material, an
  // object type); when the CRAFT guess fails, this still gives the pipeline
  // a real search term to look up matching marketplace products with,
  // instead of surfacing nothing at all. See pipeline.ts's object-fallback
  // search for how this is used.
  objectGuess: string | null
}

export async function identifyProductImage(imageDataUrl: string, questionHint?: string): Promise<ImageIdentification> {
  try {
    // The user's own turn text is a real clue the vision call was
    // previously blind to — reproduced live: a photo alone got CRAFT: NONE,
    // then the SAME photo resent alongside the follow-up "its of leather"
    // still got NONE, because this prompt never saw that text at all. A
    // correction/detail typed alongside a still-attached photo (see
    // ChatWidget.tsx's sticky activeImage) needs to actually reach this
    // call, the same way telling a person "it's leather" while they're
    // still looking at the photo would.
    const hintLine =
      questionHint && questionHint.trim()
        ? `\n\nThe user's message alongside this photo: "${questionHint.trim()}" — treat any material, ` +
          'technique, or place name mentioned there as a real, trustworthy clue (the user can see and touch ' +
          "the actual object; you're only seeing a photo), and let it override your own guess at material/" +
          'craft when the two seem to disagree.'
        : ''
    // Tried constraining this to the real ~637-name GI catalogue (pasting
    // the whole list into the prompt, "pick one of these or say NONE") —
    // empirically WORSE, not better: on a test image of Jaipur Blue
    // Pottery (about as visually unmistakable as this gets), the
    // constrained version said NONE while this plain open-ended prompt
    // correctly said "Jaipur Blue Pottery". A huge flat list in the
    // prompt seems to make the model more conservative, not more
    // accurate. Open-ended guessing + verifying the guess against the
    // real registry AFTERWARDS (resolveGIProduct in pipeline.ts) is both
    // simpler and more accurate than trying to constrain the guess itself.
    const raw = await callOpenAIVision(
      imageDataUrl,
      'This photo shows a handicraft, textile, or food product. Identify which INDIAN Geographical ' +
        'Indication (GI)-tagged CRAFT or PRODUCT TYPE this most closely resembles by its visual style, ' +
        'pattern, material, and construction (e.g. "Madhubani Painting", "Bidriware", "Kanjeevaram Silk", ' +
        '"Jaipur Blue Pottery"). Respond in EXACTLY this two-line format, nothing else:\n' +
        'CRAFT: <your best-guess craft/product name, or NONE if you cannot identify one with reasonable confidence>\n' +
        'OBJECT: <a short, generic 2-5 word description of the object itself — its material and what it depicts ' +
        '(e.g. "leather horse figurine", "blue ceramic vase", "pink silk saree") — always fill this in, even ' +
        'when CRAFT is NONE; this only needs to describe what is plainly visible, not name a specific craft>\n' +
        'DESCRIPTION: <one plain sentence describing what the image visually shows, independent of the craft guess>' +
        hintLine
    )
    const craftMatch = raw.match(/CRAFT:\s*(.+)/i)
    const objectMatch = raw.match(/OBJECT:\s*(.+)/i)
    const descMatch = raw.match(/DESCRIPTION:\s*(.+)/i)
    const craft = craftMatch?.[1]?.trim() ?? null
    const object = objectMatch?.[1]?.trim() ?? null
    return {
      craftGuess: craft && craft.toUpperCase() !== 'NONE' ? craft : null,
      objectGuess: object && object.toUpperCase() !== 'NONE' ? object : null,
      visualDescription: descMatch?.[1]?.trim() ?? '',
    }
  } catch (err) {
    console.error('Image identification failed:', err)
    return { craftGuess: null, objectGuess: null, visualDescription: '' }
  }
}
