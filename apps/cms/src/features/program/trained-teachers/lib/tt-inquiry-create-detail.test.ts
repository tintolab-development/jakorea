import { describe, expect, it } from 'vitest'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from '@/features/program/general/lib/participant-recruitment-display'
import { mapTrainedTeacherToCreateRequest } from '@/features/program/trained-teachers/api/adapters'
import { buildTrainedTeachersProgramFromRhf } from '@/features/program/trained-teachers/lib/build-registration-create-from-canonical'
import { emptyTrainedTeachersRecruitFormState } from '@/features/program/trained-teachers/lib/registration-rhf-recruitment'
import { createDefaultTrainedTeachersRegistrationRhfValues } from '@/features/program/trained-teachers/lib/registration-rhf-values'
import type { Program } from '@/types/domain'

function programWithInquiry(): Program {
  const values = createDefaultTrainedTeachersRegistrationRhfValues()
  values.recruitment = {
    ...emptyTrainedTeachersRecruitFormState(),
    announcementPublished: 'published',
    studentListRequired: 'need',
    programRangeSeal: { start: '2026-04-01', end: '2026-12-31' },
    recruitRangeSeal: { start: '2026-03-01', end: '2026-03-31' },
    finalAnnounceIso: '2026-04-02',
    finalAnnounceMethod: '홈페이지',
    targetLevels: ['ELEMENTARY'],
    targetLevelDetail: '초등',
    inquiryContact: '김문의',
    inquiryTel: '02-1234-5678',
    inquiryEmail: 'ask@jakorea.org',
    notes: '비고',
  }
  return buildTrainedTeachersProgramFromRhf({ id: 'tt-1', values })
}

describe('TT 문의처 등록→상세', () => {
  it('CREATE에 top-level contactName과 모집 행 문의처를 싣는다', () => {
    const program = programWithInquiry()
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      '김문의'
    )
    expect(program.contactPhone).toBe('02-1234-5678')
    expect(program.contactEmail).toBe('ask@jakorea.org')

    const request = mapTrainedTeacherToCreateRequest(program)
    expect(request.contactName).toBe('김문의')
    expect(request.contactPhone).toBe('02-1234-5678')
    expect(request.contactEmail).toBe('ask@jakorea.org')
    expect(request.recruitments).toHaveLength(1)
    expect(request.recruitments?.[0]).toMatchObject({
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      contactName: '김문의',
      contactPhone: '02-1234-5678',
      contactEmail: 'ask@jakorea.org',
    })
  })

  it('모집 행 문의처가 비어 있어도 nested·컬럼 문의처를 상세에 보여 준다', () => {
    const program = programWithInquiry()
    const withEmptyRows: Program = {
      ...program,
      contactName: '김문의',
      programRecruitments: [
        {
          id: 1,
          recruitmentType: 'PARTICIPANT' as const,
          applicationType: 'ORGANIZATION' as const,
          startAt: '2026-03-01',
          endAt: '2026-03-31',
          contactName: null,
          contactPhone: null,
          contactEmail: null,
        },
      ],
    }

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(withEmptyRows)
    expect(display.contactOrganizationName).toBe('김문의')
    expect(display.contactPhone).toBe('02-1234-5678')
    expect(display.contactEmail).toBe('ask@jakorea.org')
  })
})
