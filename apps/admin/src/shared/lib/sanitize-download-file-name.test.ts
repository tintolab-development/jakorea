import { describe, expect, it } from 'vitest'
import { sanitizeDownloadFileName } from './sanitize-download-file-name'

describe('sanitizeDownloadFileName', () => {
  it('/를 ,로 바꾸고 한글·공백은 유지한다', () => {
    expect(sanitizeDownloadFileName('버그/이슈 관리')).toBe('버그,이슈 관리')
  })
})
