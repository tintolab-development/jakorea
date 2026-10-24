import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_DETAILED_PROGRAM_UJAT_LABEL } from './ujat-registration-basic-info-defaults'
import {
  buildUjatProgramListRowFromRegistrationSnapshot,
  collectUjatRegistrationCreateOverlay,
  persistUjatRegistrationFormLocal,
  readUjatRegistrationLocalSaveRecords,
} from './ujat-registration-local-save'
import {
  patchUjatApplicationVolunteerOverlay,
  resetUjatApplicationVolunteerOverlayStoreForTests,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'

const draft = {
  title: 'UJAT 등록',
  paragraphs: [],
  formSettings: { titleNumbering: 'number' },
} as unknown as WritingFormDraft

describe('UJAT registration local save', () => {
  const storage = new Map<string, string>()

  beforeAll(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => storage.clear(),
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size
      },
    } satisfies Storage)
  })

  beforeEach(() => {
    storage.clear()
    resetUjatApplicationVolunteerOverlayStoreForTests()
  })

  it('같은 완료 idempotency key를 한 번만 저장한다', () => {
    const input = {
      draft,
      overlay: { 'ujat.basicInfo.programManagementName': '2026 UJAT' },
      idempotencyKey: 'completion-1',
    }

    const first = persistUjatRegistrationFormLocal(input)
    const second = persistUjatRegistrationFormLocal(input)

    expect(second.id).toBe(first.id)
    expect(readUjatRegistrationLocalSaveRecords()).toHaveLength(1)
  })

  it('지원자 수료증 파일명은 관리자 프로그램 생성 overlay에서 제외한다', () => {
    patchUjatApplicationVolunteerOverlay({
      'ujatVolunteerApplication.previousTerm': '1',
      'ujatVolunteerApplication.previousTermFileNames': ['certificate.pdf'],
    })

    const overlay = collectUjatRegistrationCreateOverlay({})

    expect(overlay['ujatVolunteerApplication.previousTerm']).toBe('1')
    expect(overlay['ujatVolunteerApplication.previousTermFileNames']).toBeUndefined()
  })
})

describe('buildUjatProgramListRowFromRegistrationSnapshot — overlay를 1차 컬럼에 반영 (버그 수정 확인)', () => {
  it('등록 overlay의 영문명·사업분야·IP·KPI를 Program에 올린다', () => {
    const program = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-create-1',
      overlay: {
        'ujat.basicInfo.repKo': '우리 동네 소비와 저축',
        'ujat.basicInfo.repEn': 'Local Spending and Saving',
        'ujat.basicInfo.programManagementName': '우리 동네 소비와 저축 운영',
        'ujat.basicInfo.detailedProgramId': '__ujat_volunteer_core__',
        'ujat.basicInfo.detailedProgramName': UJAT_DETAILED_PROGRAM_UJAT_LABEL,
        'ujat.basicInfo.businessField': 'digital_literacy',
        'ujat.basicInfo.ipOwned': 'jointly',
        'ujat.basicInfo.courseDeliveredBy': 'ja',
        'ujat.basicInfo.partnerInvolvement': 'yes',
        'ujat.basicInfo.educationCourse': 'digital_computer',
        'ujat.basicInfo.ipsCategory': 'succeed',
        'ujat.kpi.participantCount': 61,
        'ujat.kpi.volunteer': 16,
        'ujat.kpi.dispatchedSchool': 3,
        'ujat.kpi.dispatchedClass': 10,
      },
    })

    expect(program.title).toBe('우리 동네 소비와 저축 운영')
    expect(program.mainTitle).toBe('우리 동네 소비와 저축')
    expect(program.titleEn).toBe('Local Spending and Saving')
    expect(program.businessArea).toBe('디지털리터러시')
    expect(program.ipOwned).toBe('Jointly')
    expect(program.courseDeliveredBy).toBe('JA')
    expect(program.partnerInvolvement).toBe(true)
    expect(program.educationProcess).toBe('digital_computer')
    expect(program.ips).toBe('Succeed')
    expect(program.teamDivision).toBe(UJAT_DETAILED_PROGRAM_UJAT_LABEL)
    expect(program.generalCommonInfo?.detailedProgramName).toBe(UJAT_DETAILED_PROGRAM_UJAT_LABEL)
    expect(program.generalCommonInfo?.announcementTitle).toBeUndefined()
    expect(program.generalCommonInfo?.kpi).toEqual({
      finalParticipants: 61,
      instructorCount: undefined,
      volunteerCount: 16,
      finalSchools: 3,
      finalClasses: 10,
    })
  })

  it('모집 overlay 담당자·모집기간은 올리되 공고용 제목으로 운영명을 덮지 않는다', () => {
    const program = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-create-2',
      overlay: {
        'ujat.basicInfo.repKo': '우리 동네 소비와 저축',
        'ujat.basicInfo.programManagementName': '우리 동네 소비와 저축 운영',
        'ujat.basicInfo.operationRangeSeal': {
          start: '2026-11-09T15:00:00.000Z',
          end: '2026-12-06T15:00:00.000Z',
        },
        'ujat.recruit.institution.publicTitle': '우리 동네 소비와 저축 참여 기관 모집',
        'ujat.recruit.institution.programRange': {
          start: '2026-11-10T15:00:00.000Z',
          end: '2026-12-06T15:00:00.000Z',
        },
        'ujat.recruit.institution.recruitRange': {
          start: '2026-11-10T15:00:00.000Z',
          end: '2026-11-24T15:00:00.000Z',
        },
        'ujat.recruit.institution.contact': {
          name: '정민재',
          phone: '031-234-5678',
          email: 'edu.team@jakorea.org',
        },
        'ujat.recruit.institution.district': '초등학교 4~6학년',
        'ujat.recruit.volunteer.volunteerTargets': ['고등학생', '중학생'],
        'ujat.recruit.volunteer.interviewMethod': '온라인',
        'ujat.recruit.volunteer.h1.activityTerm': '3',
        'ujat.recruit.volunteer.h2.activityTerm': '4',
      },
    })

    expect(program.title).toBe('우리 동네 소비와 저축 운영')
    expect(program.mainTitle).toBe('우리 동네 소비와 저축')
    expect(program.generalCommonInfo?.announcementTitle).toBeUndefined()
    expect(program.ujatRegistrationOverlay?.['ujat.recruit.institution.publicTitle']).toBe(
      '우리 동네 소비와 저축 참여 기관 모집'
    )
    expect(program.managerName).toBe('정민재')
    expect(program.contactPhone).toBe('031-234-5678')
    expect(program.contactEmail).toBe('edu.team@jakorea.org')
    expect(program.district).toBe('초등학교 4~6학년')
    expect(program.applicationStartDate).toBe('2026-11-10T15:00:00.000Z')
    expect(program.applicationEndDate).toBe('2026-11-24T15:00:00.000Z')
    expect(program.volunteerTargets).toEqual(['고등학생', '중학생'])
    expect(program.interviewMethod).toBe('온라인')
    expect(program.rounds[0]?.startDate).toBe(program.startDate)
    expect(program.rounds[0]?.endDate).toBe(program.endDate)
    expect(program.rounds[0]?.curriculum).toBe('3')
    expect(program.ujatRegistrationOverlay?.['ujat.recruit.volunteer.h1.activityTerm']).toBe('3')
    expect(program.ujatRegistrationOverlay?.['ujat.recruit.volunteer.h2.activityTerm']).toBe('4')
  })
})
