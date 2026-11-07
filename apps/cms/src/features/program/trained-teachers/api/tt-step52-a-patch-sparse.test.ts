import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { mapTrainedTeacherToUpdateRequest } from '@/features/program/trained-teachers/api/adapters'
import {
  applyTrainedTeachersRecruitmentOverlayRecord,
  emptyTrainedTeachersRecruitFormState,
} from '@/features/program/trained-teachers/lib/registration-rhf-recruitment'

function existingProgram(patch: Partial<Program> = {}): Program {
  return {
    id: '186560',
    sponsorId: '163001',
    title: '운영 공고',
    mainTitle: '기존 대표',
    titleEn: 'Existing Title',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [
      {
        id: 'r1',
        programId: '186560',
        roundNumber: 1,
        startDate: '2026-04-01',
        endDate: '2026-04-02',
        capacity: 20,
        classCount: 1,
        status: 'pending',
        curriculum: '기존 커리큘럼',
      },
    ],
    startDate: '2026-04-01',
    endDate: '2026-11-30',
    applicationStartDate: '2026-03-01T00:00:00.000Z',
    applicationEndDate: '2026-11-27T23:59:59.999Z',
    remarks: '예전 top-level 비고',
    curriculum: '컬럼 커리큘럼',
    textbookName: '진짜 교재명',
    status: 'pending',
    backendProgramType: 'TRAINED_TEACHER',
    generalCommonInfo: {
      participantRecruitmentInfo: {
        remarks: '모집 비고 최신',
        inquiryTel: '02-000-0000',
        maxClassCount: 4,
      },
    },
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...patch,
  }
}

describe('TT STEP 5.2 A PATCH sparse ownership', () => {
  it('titleEn만 수정하면 일정·모집마감·비고·미변경 컬럼을 재전송하지 않는다', () => {
    const existing = existingProgram()
    const request = mapTrainedTeacherToUpdateRequest(existing, { titleEn: 'Revised EN' })
    expect(request.titleEn).toBe('Revised EN')
    expect(request.mainTitle).toBeUndefined()
    expect(request.rounds).toBeUndefined()
    expect(request.applicationStartDate).toBeUndefined()
    expect(request.applicationEndDate).toBeUndefined()
    expect(request.remarks).toBeUndefined()
    expect(request.curriculum).toBeUndefined()
    expect(request.textbookName).toBeUndefined()
    expect(request.serviceDetailJson).toBeUndefined()
  })

  it('mainTitle 변경은 대표명만 보내고 교재명·커리큘럼과 섞지 않는다', () => {
    const request = mapTrainedTeacherToUpdateRequest(existingProgram(), {
      mainTitle: '새 대표',
    })
    expect(request.mainTitle).toBe('새 대표')
    expect(request.textbookName).toBeUndefined()
    expect(request.curriculum).toBeUndefined()
    expect(request.titleEn).toBeUndefined()
  })

  it('미변경 모집 마감 시각 23:59:59.999 를 날짜만으로 잘라 재전송하지 않는다', () => {
    const existing = existingProgram()
    const request = mapTrainedTeacherToUpdateRequest(existing, {
      title: '공고만',
    })
    expect(request.applicationEndDate).toBeUndefined()
    const changed = mapTrainedTeacherToUpdateRequest(existing, {
      applicationEndDate: '2026-11-27T23:59:59.999Z',
    })
    expect(changed.applicationEndDate).toBe('2026-11-27T23:59:59.999Z')
  })

  it('공통 저장은 비고를 보내지 않아 예전 top-level 값으로 모집 비고를 덮지 않는다', () => {
    const existing = existingProgram()
    const request = mapTrainedTeacherToUpdateRequest(existing, {
      generalCommonInfo: { announcementTitle: '공고' },
    })
    expect(request.remarks).toBeUndefined()
    const json = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: {
        remarks?: string
        generalCommonInfo?: { participantRecruitmentInfo?: { remarks?: string } }
      }
    }
    expect(json.program?.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(json.program?.remarks).toBeUndefined()
  })

  it('모집 비고 patch는 GET nested와 merge한다', () => {
    const request = mapTrainedTeacherToUpdateRequest(existingProgram(), {
      remarks: '모집 비고 신값',
      generalCommonInfo: {
        participantRecruitmentInfo: { remarks: '모집 비고 신값' },
      },
    })
    expect(request.remarks).toBe('모집 비고 신값')
    const json = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: { generalCommonInfo?: { participantRecruitmentInfo?: { remarks?: string; inquiryTel?: string } } }
    }
    expect(json.program?.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
  })

  it('공통정보 PATCH에 schedules를 넣지 않는다', () => {
    const request = mapTrainedTeacherToUpdateRequest(existingProgram(), {
      remarks: '정본 비고',
      mainTitle: '수정된 대표명',
    })
    expect(request.remarks).toBe('정본 비고')
    expect(request.mainTitle).toBe('수정된 대표명')
    expect(request.schedules).toBeUndefined()
    expect(request.rounds).toBeUndefined()
  })

  it('비고를 비우면 빈 문자열이 아니라 clearFields remarks를 보낸다', () => {
    const request = mapTrainedTeacherToUpdateRequest(existingProgram(), { remarks: '' })
    expect(request.remarks).toBeUndefined()
    expect(request.clearFields).toEqual(expect.arrayContaining(['remarks']))
  })

  it('모집 마감 날짜만 PATCH하면 시각을 붙이지 않고 원 문자열을 보낸다', () => {
    const request = mapTrainedTeacherToUpdateRequest(existingProgram(), {
      applicationEndDate: '2026-11-27',
    })
    expect(request.applicationEndDate).toBe('2026-11-27')
  })

  it('participantRecruitmentInfo 부분 객체는 보낸 키만 JSON에 싣는다', () => {
    const request = mapTrainedTeacherToUpdateRequest(existingProgram(), {
      generalCommonInfo: {
        participantRecruitmentInfo: { maxScheduleCount: 6 },
      },
    })
    const json = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: {
        generalCommonInfo?: { participantRecruitmentInfo?: Record<string, unknown> }
      }
    }
    expect(json.program?.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      maxScheduleCount: 6,
    })
    expect(json.program?.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBeUndefined()
    expect(json.program?.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBeUndefined()
    expect(
      json.program?.generalCommonInfo?.participantRecruitmentInfo?.maxSessionsPerDay
    ).toBeUndefined()
  })
})

describe('TT STEP 5.2 대상 코드 정규화', () => {
  it('대학(원)생 라벨을 university로 저장한다', () => {
    const next = applyTrainedTeachersRecruitmentOverlayRecord(
      emptyTrainedTeachersRecruitFormState(),
      { 'recruit.targetLevels': ['대학(원)생'] }
    )
    expect(next.targetLevels).toEqual(['university'])
  })
})
