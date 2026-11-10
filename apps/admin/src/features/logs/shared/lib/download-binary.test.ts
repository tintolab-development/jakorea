import { describe, expect, it } from 'vitest'
import { defaultXlsxFilename } from './download-binary'

describe('defaultXlsxFilename', () => {
  const now = new Date(2026, 10, 10)

  it('[JA Korea] 홈페이지 어드민_파일 이름_YYMMDD.xlsx 규칙을 따른다', () => {
    expect(defaultXlsxFilename('회원 로그인 이력', now)).toBe(
      '[JA Korea] 홈페이지 어드민_회원 로그인 이력_261110.xlsx'
    )
  })

  it('빗금은 쉼표로 바꾼다', () => {
    expect(defaultXlsxFilename('버그/이슈 이력', now)).toBe(
      '[JA Korea] 홈페이지 어드민_버그,이슈 이력_261110.xlsx'
    )
  })
})
