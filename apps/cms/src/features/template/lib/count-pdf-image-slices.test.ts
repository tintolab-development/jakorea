import { describe, expect, it } from 'vitest'
import { countPdfImageSlices } from './count-pdf-image-slices'

describe('countPdfImageSlices', () => {
  it('keeps an A4-sized capture on a single page', () => {
    expect(countPdfImageSlices(297, 297)).toBe(1)
    expect(countPdfImageSlices(297.4, 297)).toBe(1)
  })

  it('splits content taller than one A4 page', () => {
    expect(countPdfImageSlices(400, 297)).toBe(2)
    expect(countPdfImageSlices(900, 297)).toBe(4)
  })
})
