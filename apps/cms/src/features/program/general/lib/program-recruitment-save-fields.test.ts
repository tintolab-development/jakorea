import { describe, expect, it } from 'vitest'
import {
  programParticipantRecruitmentSaveSchema,
  programTrainedTeachersRecruitmentSaveSchema,
} from './program-recruitment-save-fields'

describe('programParticipantRecruitmentSaveSchema', () => {
  it('allows empty recruitment fields so common-info required values do not block save', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects an invalid contact phone', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({
      contactPhone: '1234',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.message).toContain('전화번호')
  })

  it('accepts a valid Korean contact phone', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({
      contactPhone: '010-1234-5678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a negative max class count', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({
      participantRecruitmentMaxClassCount: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('programTrainedTeachersRecruitmentSaveSchema', () => {
  const complete = {
    participantRecruitmentAnnouncementPublished: 'published',
    studentListRequired: 'required',
    participantRecruitmentMaxClassCount: 4,
    participantRecruitmentMaxScheduleCount: 3,
    participantRecruitmentMaxSessionsPerDay: 8,
    participantProgramOperationStartDate: '2026-11-01T00:00:00.000Z',
    participantProgramOperationEndDate: '2026-12-15T00:00:00.000Z',
    applicationStartDate: '2026-10-01T00:00:00.000Z',
    applicationEndDate: '2026-10-31T00:00:00.000Z',
    targetLevels: ['elementary'],
    educationTargetDetail: '초등 5~6학년',
    resultAnnouncementDate: '2026-11-02T00:00:00.000Z',
    resultAnnouncementMethod: '이메일 안내',
    recruitmentContactOrganizationName: 'JA Korea',
    contactPhone: '010-1234-5678',
    contactEmail: 'recruit@tinto.co.kr',
    remarks: '비고',
  }

  it('rejects an empty TT recruitment edit', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts a complete TT recruitment edit', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse(complete)
    expect(result.success).toBe(true)
  })

  it('참여자 행 문의처가 비어 있어도 저장할 수 있다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      recruitmentContactOrganizationName: '',
      contactPhone: '',
      contactEmail: '',
    })
    expect(result.success).toBe(true)
  })

  it('날짜 지정형은 최대 일정·1일 최대 차시를 저장 필수값으로 요구하지 않는다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      participantRecruitmentMaxScheduleCount: undefined,
      participantRecruitmentMaxSessionsPerDay: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('학급 수를 null로 비우면 필수로 실패한다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      participantRecruitmentMaxClassCount: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toContain(
        'participantRecruitmentMaxClassCount'
      )
    }
  })

  it('기간형은 표시되는 최대 일정·1일 최대 차시를 저장 필수값으로 요구한다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
      participantRecruitmentMaxScheduleCount: undefined,
      participantRecruitmentMaxSessionsPerDay: undefined,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'participantRecruitmentMaxScheduleCount',
          'participantRecruitmentMaxSessionsPerDay',
        ])
      )
    }
  })

  it('커리큘럼 단일 회차 + 기간형도 1일 최대 차시를 요구한다 (Platform TT 희망 차시 셀렉 조건)', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      participantRecruitmentMaxScheduleCount: 2,
      participantRecruitmentMaxSessionsPerDay: undefined,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path.join('.'))).toContain(
        'participantRecruitmentMaxSessionsPerDay'
      )
    }
  })

  it('일정형 단일 + 기간형은 희망 교육일만 받으므로 1일 최대 차시를 요구하지 않는다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      participantRecruitmentMaxScheduleCount: 2,
      participantRecruitmentMaxSessionsPerDay: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('해당 없음이면 비고가 비어도 학생 명단 제출만 수정해 저장할 수 있다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      studentListRequired: 'not_required',
      remarks: null,
      participantRecruitmentNotesNotApplicable: 'not_applicable',
    })
    expect(result.success).toBe(true)
  })

  it('비고가 비어 있으면 한글 안내를 내고 영문 필드명을 쓰지 않는다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      remarks: null,
      participantRecruitmentNotesNotApplicable: 'applicable',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message)).toContain('비고를 입력해주세요')
      expect(result.error.issues.map(issue => issue.message).join(' ')).not.toMatch(/remarks/)
    }
  })

  it('교육 대상 상세가 비어 있으면 한글 안내를 낸다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      educationTargetDetail: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message)).toContain(
        '교육 대상 상세를 입력해주세요'
      )
      expect(result.error.issues.map(issue => issue.message).join(' ')).not.toMatch(
        /educationTargetDetail/
      )
    }
  })

  it('공고 미게시이면 일정·발표 필드가 비어도 저장할 수 있다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      participantRecruitmentAnnouncementPublished: 'unpublished',
      participantProgramOperationStartDate: null,
      participantProgramOperationEndDate: '',
      applicationStartDate: null,
      applicationEndDate: undefined,
      resultAnnouncementDate: null,
      resultAnnouncementMethod: '',
    })
    expect(result.success).toBe(true)
  })

  it('공고 게시인데 모집 기간이 없으면 한글 안내를 낸다', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({
      ...complete,
      applicationStartDate: null,
      applicationEndDate: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message)).toEqual(
        expect.arrayContaining([
          '참여자 모집 시작일을 선택해주세요',
          '참여자 모집 종료일을 선택해주세요',
        ])
      )
      expect(result.error.issues.map(issue => issue.message).join(' ')).not.toMatch(
        /applicationStartDate|applicationEndDate/
      )
    }
  })
})
