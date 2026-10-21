import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyParticipantRecruitmentColumnsFromResponse,
  applyProgramMissingCommonStringFieldsToUpdateRequest,
  mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo,
  resolveOtherNotesFromProgramResponse,
  resolveProgramInquiryContactName,
  resolveProgramOtherMatters,
  resolveProgramRecruitmentTargetDetail,
} from './program-update-common-string-fields'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '1',
    sponsorId: 's1',
    title: 'P',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'pending',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

describe('program-update-common-string-fields', () => {
  it('resolves inquiry contactName from nested person then org', () => {
    expect(
      resolveProgramInquiryContactName(
        baseProgram({
          generalCommonInfo: {
            participantRecruitmentInfo: {
              contactOrganizationName: 'JA',
              contactName: '김담당',
            },
          },
        })
      )
    ).toBe('김담당')
    expect(
      resolveProgramInquiryContactName(
        baseProgram({
          generalCommonInfo: {
            participantRecruitmentInfo: { contactOrganizationName: 'JA' },
          },
        })
      )
    ).toBe('JA')
  })

  it('maps otherNotes to otherMatters and never sends empty string', () => {
    const body: Parameters<typeof applyProgramMissingCommonStringFieldsToUpdateRequest>[0] = {}
    applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
      mode: 'full',
      merged: baseProgram({ otherNotes: '준비물 지참' }),
      existing: baseProgram(),
    })
    expect(body.otherMatters).toBe('준비물 지참')
    expect(body.clearFields).toBeUndefined()
  })

  it('uses clearFields when user clears a previously set value', () => {
    const body: Parameters<typeof applyProgramMissingCommonStringFieldsToUpdateRequest>[0] = {}
    applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
      mode: 'full',
      existing: baseProgram({
        otherNotes: '구 기타',
        generalCommonInfo: {
          participantRecruitmentInfo: {
            contactName: '구담당',
            recruitmentTargetDetail: '구 상세',
          },
        },
      }),
      merged: baseProgram({
        otherNotes: '   ',
        generalCommonInfo: { participantRecruitmentInfo: {} },
      }),
    })
    expect(body.otherMatters).toBeUndefined()
    expect(body.contactName).toBeUndefined()
    expect(body.recruitmentTargetDetail).toBeUndefined()
    expect(body.clearFields).toEqual(
      expect.arrayContaining(['contactName', 'otherMatters', 'recruitmentTargetDetail'])
    )
  })

  it('patch mode only wires touched and changed fields', () => {
    const body: Parameters<typeof applyProgramMissingCommonStringFieldsToUpdateRequest>[0] = {}
    applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
      mode: 'patch',
      patch: { otherNotes: '신규' },
      existing: baseProgram({ otherNotes: '구' }),
      merged: baseProgram({
        otherNotes: '신규',
        generalCommonInfo: {
          participantRecruitmentInfo: { contactName: '담당' },
        },
      }),
    })
    expect(body.otherMatters).toBe('신규')
    expect(body.contactName).toBeUndefined()
  })

  it('omits unchanged fields even in full mode', () => {
    const body: Parameters<typeof applyProgramMissingCommonStringFieldsToUpdateRequest>[0] = {}
    applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
      mode: 'full',
      existing: baseProgram({ otherNotes: '동일' }),
      merged: baseProgram({ otherNotes: '동일' }),
    })
    expect(body.otherMatters).toBeUndefined()
    expect(body.clearFields).toBeUndefined()
  })

  it('hydrates GET columns into nested recruitment info', () => {
    const merged = mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
      { contactOrganizationName: 'JA', contactName: '구' },
      { contactName: '신담당', recruitmentTargetDetail: '중학생' }
    )
    expect(merged.contactName).toBe('신담당')
    expect(merged.recruitmentTargetDetail).toBe('중학생')
    expect(merged.contactOrganizationName).toBe('JA')
  })

  it('prefers otherMatters over nested otherNotes and ignores remarks', () => {
    expect(resolveOtherNotesFromProgramResponse({ otherMatters: '컬럼', otherNotes: 'json' })).toBe(
      '컬럼'
    )
    expect(resolveProgramOtherMatters(baseProgram({ otherNotes: 'x', remarks: '비고' }))).toBe('x')
    expect(
      resolveProgramRecruitmentTargetDetail(
        baseProgram({
          educationTargetDetail: '교육상세',
          generalCommonInfo: {
            participantRecruitmentInfo: { recruitmentTargetDetail: '모집상세' },
          },
        })
      )
    ).toBe('모집상세')
  })

  it('참여자 모집 행이 있으면 빈 프로그램 remarks가 nested 비고를 지우지 않는다', () => {
    const next = applyParticipantRecruitmentColumnsFromResponse(
      baseProgram({
        programRecruitments: [{ id: 1, recruitmentType: 'PARTICIPANT' }],
        generalCommonInfo: {
          participantRecruitmentInfo: { remarks: '저장한 비고', applicationMethod: '온라인' },
        },
      }),
      { remarks: null, applicationMethod: null }
    )
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('저장한 비고')
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.applicationMethod).toBeUndefined()
  })
})
