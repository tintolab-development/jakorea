import { describe, expect, it } from 'vitest'
import { mapSecondInterviewStatusToFinalResultPayload } from '@/features/program/general/api/admin-applications-service'
import { GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS } from '@/features/program/general/lib/volunteer-screening-constants'
import { buildGeneralVolunteerInterview2PassTypeCopy } from './interview2-pass-type-modal'

describe('buildGeneralVolunteerInterview2PassTypeCopy', () => {
  it('단건 — 시안 16-1 면접 합격 안내 문구', () => {
    expect(buildGeneralVolunteerInterview2PassTypeCopy({ mode: 'single', subjectName: '김제이' })).toEqual({
      title: '면접 합격 안내',
      message:
        '**[김제이]** 님의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.',
    })
  })

  it('일괄 — 시안 12-1 면접 일괄 합격 안내 문구', () => {
    expect(
      buildGeneralVolunteerInterview2PassTypeCopy({
        mode: 'bulk',
        subjectName: '김제이',
        selectionCount: 4,
      })
    ).toEqual({
      title: '면접 일괄 합격 안내',
      message:
        '**[김제이] 님 외 3명**의 면접 결과를 합격 처리하시겠습니까?\n합격 시 회원에게 합격 알림이 발송됩니다.',
    })
  })
})

describe('합격 유형 → final-result payload', () => {
  it('합격·예비합격 1~4가 PASS / RESERVE(reserveRank)로 매핑된다', () => {
    const payloads = GENERAL_INTERVIEW2_BULK_PASS_TYPE_OPTIONS.map(option =>
      mapSecondInterviewStatusToFinalResultPayload(option.value)
    )
    expect(payloads[0]?.result).toBe('PASS')
    expect(payloads.slice(1).map(p => [p.result, p.reserveRank])).toEqual([
      ['RESERVE', 1],
      ['RESERVE', 2],
      ['RESERVE', 3],
      ['RESERVE', 4],
    ])
  })
})
