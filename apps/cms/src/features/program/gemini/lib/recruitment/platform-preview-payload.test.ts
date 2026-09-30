import { describe, expect, it } from 'vitest'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from './add-local-save'
import { buildGeminiRecruitmentPortalPreview } from './platform-preview-payload'

describe('buildGeminiRecruitmentPortalPreview', () => {
  it('maps the recruitment add snapshot like the create request', () => {
    const detail = buildGeminiRecruitmentPortalPreview({
      ...createDefaultGeminiRecruitmentAddFormSnapshot(),
      title: '찾아가는 Gemini 연수',
      educationForm: 'online',
      educationTargetLevels: ['adult'],
      educationTargetDetail: '교사',
      applicationPeriodStart: '2026-10-01',
      applicationPeriodEnd: '2026-10-31',
      inquiryContactName: 'JA Korea',
      notesNotApplicable: false,
      notes: '기타 안내',
      programDescription: '소개',
    })

    expect(detail).toMatchObject({
      programId: 0,
      programType: 'GEMINI_TRAINING',
      title: '찾아가는 Gemini 연수',
      summary: '소개',
      operationMethod: 'ONLINE',
      businessStartDate: '2026-10-01T00:00:00',
      businessEndDate: '2026-10-31T00:00:00',
      contactName: 'JA Korea',
      otherMatters: '기타 안내',
      educationTargets: ['adult'],
      recruitmentTargetDetail: '교사',
      recruitments: [
        {
          recruitmentType: 'PARTICIPANT',
          startAt: '2026-10-01T00:00:00',
          endAt: '2026-10-31T00:00:00',
        },
      ],
    })
  })

  it('omits notes when marked not applicable', () => {
    const detail = buildGeminiRecruitmentPortalPreview({
      ...createDefaultGeminiRecruitmentAddFormSnapshot(),
      notesNotApplicable: true,
      notes: '숨김',
    })
    expect(detail.otherMatters).toBeUndefined()
    expect(detail.title).toBe('(공고명 없음)')
  })
})
