import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('useHydrateRichTextInlineImages', () => {
  it('미리보기는 skipGlobalErrorAlert download만 쓰고 /content fallback이 없다', () => {
    const source = readFileSync(
      new URL('./use-rich-text-inline-image.ts', import.meta.url),
      'utf8'
    )
    expect(source).toContain('skipGlobalErrorAlert: true')
    expect(source).toContain('loadAdminFileBlob')
    expect(source).not.toMatch(/getFileContentPath|files\/\$\{.*\}\/content/)
  })
})
