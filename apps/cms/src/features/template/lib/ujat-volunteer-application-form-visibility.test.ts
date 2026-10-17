import { describe, expect, it } from 'vitest'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS as IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import {
  resolveUjatVolunteerHiddenParagraphIds,
  resolveUjatVolunteerRuntimeHiddenParagraphIds,
} from './ujat-volunteer-application-form-visibility'
import { resolveUjatVolunteerSubmitConfirmationItemLabel } from './ujat-volunteer-submit-confirmation-label'

describe('UJAT 봉사자 신청 Form 지원 형태별 단락 visibility', () => {
  it('신규 봉사자는 이전 활동 단락을 숨기고 자유작성 단락을 노출한다', () => {
    const hidden = resolveUjatVolunteerRuntimeHiddenParagraphIds('new')

    expect(hidden).toEqual(new Set([IDS.previousTerm]))
    expect(hidden.has(IDS.freeTextItems)).toBe(false)
  })

  it('수료자 봉사자는 자유작성 단락을 숨기고 이전 활동 단락을 노출한다', () => {
    const hidden = resolveUjatVolunteerRuntimeHiddenParagraphIds('ujat-graduate')

    expect(hidden).toEqual(new Set([IDS.freeTextItems]))
    expect(hidden.has(IDS.previousTerm)).toBe(false)
  })

  it('템플릿 authoring에서는 두 지원 형태 단락을 모두 편집할 수 있다', () => {
    expect(resolveUjatVolunteerHiddenParagraphIds('new', { isTemplateAuthoringMode: true })).toBeUndefined()
    expect(
      resolveUjatVolunteerHiddenParagraphIds('ujat-graduate', { isTemplateAuthoringMode: true })
    ).toBeUndefined()
  })

  it('모집 활동 기수로 제출 확인 문구의 N기를 치환한다', () => {
    expect(
      resolveUjatVolunteerSubmitConfirmationItemLabel(
        '네, 상기 내용 모두 확인하였으며, 대학생경제교육봉사단 UJAT N기로 지원합니다.',
        '8'
      )
    ).toContain('UJAT 8기로')
  })
})
