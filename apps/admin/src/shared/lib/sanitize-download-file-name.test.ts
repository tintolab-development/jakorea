import { describe, expect, it } from 'vitest'
import { sanitizeDownloadFileName } from './sanitize-download-file-name'

describe('sanitizeDownloadFileName', () => {
  it('/를 ,로 바꾸고 한글·공백은 유지한다', () => {
    expect(sanitizeDownloadFileName('버그/이슈 관리')).toBe('버그,이슈 관리')
  })
})

describe('toRuleDownloadFileName', () => {
  it('업로드 원본은 [JA Korea] {원본}_YYMMDD.확장자, 규칙 이름은 그대로', async () => {
    const { toRuleDownloadFileName } = await import('./sanitize-download-file-name')
    const d = new Date('2026-11-09T23:30:00Z')
    expect(toRuleDownloadFileName('이력서.pdf', d)).toBe('[JA Korea] 이력서_261110.pdf')
    expect(toRuleDownloadFileName('[JA Korea] 홈페이지 어드민_회원 로그인 이력_261110.xlsx', d)).toBe(
      '[JA Korea] 홈페이지 어드민_회원 로그인 이력_261110.xlsx'
    )
  })
})
