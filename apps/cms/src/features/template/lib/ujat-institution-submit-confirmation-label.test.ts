import { describe, expect, it } from 'vitest'
import { resolveUjatInstitutionSubmitConfirmationItemLabel } from '@/features/template/lib/ujat-institution-submit-confirmation-label'

describe('resolveUjatInstitutionSubmitConfirmationItemLabel', () => {
  it('replaces the year in the confirmation label', () => {
    const label =
      '네, 상기 내용 모두 확인하였으며, 2024년 JA Korea 초등 경제교육 대상 학교에 지원합니다.'
    expect(resolveUjatInstitutionSubmitConfirmationItemLabel(label, 2026)).toBe(
      '네, 상기 내용 모두 확인하였으며, 2026년 JA Korea 초등 경제교육 대상 학교에 지원합니다.'
    )
  })
})
