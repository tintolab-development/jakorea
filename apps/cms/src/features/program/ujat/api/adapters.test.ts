import { describe, expect, it } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import { buildUjatProgramListRowFromRegistrationSnapshot } from '@/features/program/ujat/lib/ujat-registration-local-save'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  fromDetail,
  fromListItem,
  buildUjatNewVolunteerHalfRowRequests,
  mapUjatProgramRecruitmentsToRequest,
  toCreateRequest,
  toUpdateRequest,
} from './adapters'
import { shouldRetryQuery } from './errors'
import { toRemoteListParams } from './list-params'
import { parseRegistrationSnapshot } from './service-detail'
import { resolveUjatRecruitAnnouncementTitle } from '@/features/program/ujat/lib/ujat-recruit-display-program'

const program: Program = {
  id: 'ujat-1',
  sponsorId: 'sponsor-1',
  title: '2026 UJAT',
  type: 'offline',
  format: 'course',
  category: 'school',
  rounds: [],
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T23:59:59.999Z',
  status: 'active',
  lifecycleStatus: 'planned',
  ujatProgressStatus: 'VOLUNTEER_RECRUITING',
  ujatFirstHalfVolunteerCount: 120,
  ujatSecondHalfVolunteerCount: 100,
  targetLevels: ['elementary'],
  volunteerTargets: ['대학생'],
  scheduleTimeEnabled: true,
  startTime: '09:00',
  endTime: '12:00',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const draft = {
  title: 'UJAT 등록',
  paragraphs: [],
  formSettings: { titleNumbering: 'number' },
} as unknown as WritingFormDraft

describe('UJAT program adapters', () => {
  it('후원사 담당자 미선택 시 create body에 sentinel·contact id를 넣지 않는다', () => {
    const pending = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-pending-test',
      overlay: {
        'ujat.basicInfo.sponsorId': '163348',
        'ujat.basicInfo.sponsorContactIds': [SPONSOR_CONTACT_UNSELECTED_VALUE],
        'ujat.basicInfo.sponsorContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
        'ujat.basicInfo.sponsorManagerName': '미선택',
        'ujat.recruit.institution.targetLevels': ['university', 'elementary'],
      },
    })
    const request = toCreateRequest(pending, {
      draft,
      overlay: pending.ujatRegistrationOverlay ?? {},
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: { generalCommonInfo?: { sponsorManagerContactIds?: string[] } }
      registration?: { overlay?: Record<string, unknown> }
    }

    expect(request.sponsors).toEqual([{ sponsorId: '163348' }])
    expect(request.targetLevels).toEqual(['university', 'elementary'])
    expect(detail.program?.generalCommonInfo?.sponsorManagerContactIds).toBeUndefined()
    expect(detail.registration?.overlay?.['ujat.basicInfo.sponsorContactIds']).toBeUndefined()
    expect(detail.registration?.overlay?.['ujat.basicInfo.sponsorContactId']).toBeUndefined()
  })

  it('create 요청은 programType·serviceDetailJson을 body 앞쪽에 둔다', () => {
    const request = toCreateRequest(program, { draft, overlay: {} })
    const keys = Object.keys(request)
    expect(keys.indexOf('programType')).toBeLessThan(keys.indexOf('category'))
    expect(keys.indexOf('serviceDetailJson')).toBeLessThan(keys.indexOf('rounds'))
    expect(() => JSON.parse(request.serviceDetailJson ?? '')).not.toThrow()
    expect(request.programType).toBe('UJAT')
  })

  it('typed-owned registration overlay와 create 메타는 serviceDetailJson에 넣지 않는다', () => {
    const request = toCreateRequest(program, {
      draft,
      overlay: {
        idempotencyKey: 'test-key',
        preparedFormBindings: { programDraftId: 9, formBindings: [] },
        'ujat.basicInfo.repKo': 'rep',
      },
      // create()가 `{ ...input, overlay }`로 넘기는 메타 — registration 루트에 실리면 안 됨
      ...({
        idempotencyKey: 'cb585393-369e-414c-bf42-7bb1b0c43ac9',
        preparedFormBindings: { programDraftId: 3, formBindings: [] },
      } as object),
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      registration?: {
        overlay?: Record<string, unknown>
        idempotencyKey?: unknown
        preparedFormBindings?: unknown
      }
    }
    expect(detail.registration?.overlay?.idempotencyKey).toBeUndefined()
    expect(detail.registration?.overlay?.preparedFormBindings).toBeUndefined()
    expect(detail.registration?.idempotencyKey).toBeUndefined()
    expect(detail.registration?.preparedFormBindings).toBeUndefined()
    expect(detail.registration?.overlay?.['ujat.basicInfo.repKo']).toBeUndefined()
  })

  it('create 요청은 UJAT 제안값을 Typed API 경계 밖으로 분리하고 versioned 상세를 유지한다', () => {
    const request = toCreateRequest(program, {
      draft,
      overlay: { 'ujat.basicInfo.programManagementName': '2026 UJAT' },
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      version?: number
      registration?: { overlay?: Record<string, unknown> }
    }

    expect(request.programType).toBe('UJAT')
    expect(request.educationStructure).toBe('SCHEDULE')
    expect(request.businessStartDate).toBe(program.startDate)
    expect(detail.version).toBe(1)
    expect(detail.registration?.overlay?.['ujat.basicInfo.programManagementName']).toBeUndefined()
  })

  it('UJAT 전용 필드를 serviceDetailJson으로 round-trip 한다', () => {
    const request = toCreateRequest(program)
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: request.serviceDetailJson,
    })

    expect(mapped.ujatProgressStatus).toBe('VOLUNTEER_RECRUITING')
    expect(mapped.ujatFirstHalfVolunteerCount).toBe(120)
    expect(mapped.volunteerTargets).toEqual(['대학생'])
    expect(mapped.startTime).toBe('09:00')
  })

  it('Create는 숙박비·장거리 교통비를 paymentItems로 보낸다', () => {
    const request = toCreateRequest({
      ...program,
      generalCommonInfo: { paymentItems: '숙박비, 장거리 교통비' },
    })
    expect(request.paymentItems).toEqual([
      { itemType: 'LODGING', useYn: true },
      { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
    ])
  })

  it('지급 항목 외 PATCH는 paymentItems를 omit한다', () => {
    const existing: Program = {
      ...program,
      generalCommonInfo: { paymentItems: '숙박비' },
    }
    const request = toUpdateRequest(existing, { title: '제목만' }, { overlay: {} })
    expect(request).not.toHaveProperty('paymentItems')
  })

  it('전체 지급 항목 해제는 paymentItems: []를 보낸다', () => {
    const existing: Program = {
      ...program,
      generalCommonInfo: { paymentItems: '숙박비' },
    }
    const request = toUpdateRequest(
      existing,
      { generalCommonInfo: { paymentItems: '해당없음' } },
      { overlay: {} }
    )
    expect(request.paymentItems).toEqual([])
  })

  it('상세 settlementPolicy 지급 항목을 유형으로 숨기지 않는다', () => {
    const mapped = fromDetail({
      id: program.id,
      title: program.title,
      programType: 'UJAT',
      settlementPolicy: {
        paymentItems: [
          { itemType: 'TRANSPORTATION', useYn: true },
          { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
          { itemType: 'LODGING', useYn: true },
        ],
      },
    })
    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비, 장거리 교통비, 숙박비')
  })

  it('settlementPolicy.paymentItems []는 JSON overlay 지급 항목을 덮어 빈 상태로 둔다', () => {
    const mapped = fromDetail({
      id: program.id,
      title: program.title,
      programType: 'UJAT',
      serviceDetailJson: JSON.stringify({
        generalCommonInfo: { paymentItems: '숙박비' },
      }),
      settlementPolicy: { paymentItems: [] },
    })
    expect(mapped.generalCommonInfo?.paymentItems).toBeUndefined()
  })

  it('수정 요청은 등록 draft와 비-typed 호환 overlay만 보존한다', () => {
    const created = toCreateRequest(program, {
      draft,
      overlay: { 'ujat.basicInfo.programManagementName': '2026 UJAT' },
    })
    const registration = parseRegistrationSnapshot(created.serviceDetailJson)
    const updated = toUpdateRequest(program, { title: '수정된 UJAT' }, registration)
    const detail = JSON.parse(updated.serviceDetailJson ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
    }

    expect(detail.registration?.overlay?.['ujat.basicInfo.programManagementName']).toBeUndefined()
    expect(updated.title).toBe('수정된 UJAT')
    expect(updated.rounds).toBeUndefined()
    expect(updated.managerName).toBeUndefined()
  })

  it('공통정보 패치는 컬럼 targetLevels를 유지하고 모집 라벨로 키우지 않는다', () => {
    const existing: Program = {
      ...program,
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      generalCommonInfo: {
        announcementTitle: '기존 공고',
        participantRecruitmentInfo: {
          educationTarget: '초등학교, 중학교, 대학(원)생',
        },
      },
    }
    const request = toUpdateRequest(existing, {
      title: '수정된 UJAT',
      generalCommonInfo: { announcementTitle: '수정된 공고' },
    })
    expect(request.targetLevels).toEqual(['elementary'])
    expect(request.targetLevel).toBe('elementary')
  })

  it('부분 수정에 educationStructure를 싣고 지역 정원 overlay를 재조회한다', () => {
    const capacity = {
      h1: { 서울: { classCount: '2', volunteerCount: '4' } },
    }
    const created = toCreateRequest(
      { ...program, generalProgramEducationStructure: 'curriculum' },
      {
        draft,
        overlay: { 'ujat.capacity.byRegion': capacity },
      }
    )
    const registration = parseRegistrationSnapshot(created.serviceDetailJson)
    const updated = toUpdateRequest(
      { ...program, generalProgramEducationStructure: 'curriculum' },
      { generalProgramEducationStructure: 'curriculum', title: '수정된 UJAT' },
      registration
    )
    expect(updated.educationStructure).toBe('CURRICULUM')

    const mapped = fromDetail({
      id: program.id,
      title: '수정된 UJAT',
      educationStructure: 'CURRICULUM',
      serviceDetailJson: updated.serviceDetailJson ?? undefined,
    })
    expect(mapped.generalProgramEducationStructure).toBe('curriculum')
    expect(mapped.ujatRegistrationOverlay?.['ujat.capacity.byRegion']).toEqual(capacity)
  })

  it('부분 수정에 ips와 후원 담당자 sponsors를 싣고 재조회한다', () => {
    const updated = toUpdateRequest(
      {
        ...program,
        sponsorId: '163388',
        ips: 'Inspire',
        generalCommonInfo: { sponsorManagerContactIds: ['1627253'] },
      },
      {
        ips: 'Inspire',
        sponsorId: '163388',
        generalCommonInfo: { sponsorManagerContactIds: ['1627253'] },
      }
    )
    expect(updated.ips).toBe('Inspire')
    expect(updated.sponsors).toEqual([{ sponsorId: '163388', sponsorContactId: '1627253' }])

    const mapped = fromDetail({
      id: program.id,
      title: program.title,
      sponsorId: '163388',
      ips: 'Inspire',
      serviceDetailJson: updated.serviceDetailJson ?? undefined,
    })
    expect(mapped.ips).toBe('Inspire')
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.ipsCategory']).toBe('inspire')
  })

  it('상세 사업 기간은 businessStartDate/EndDate를 쓴다', () => {
    const mapped = fromDetail({
      id: program.id,
      startDate: '2026-10-21',
      endDate: '2026-11-01',
      businessStartDate: '2026-10-14',
      businessEndDate: '2026-11-07',
    })
    expect(mapped.startDate).toBe('2026-10-14')
    expect(mapped.endDate).toBe('2026-11-07')
  })

  it('상세 응답의 businessField alias도 사업 분야로 읽는다', () => {
    const mapped = fromDetail({
      id: '1',
      title: 'UJAT 프로그램',
      businessField: 'digital_literacy',
    } as Parameters<typeof fromDetail>[0] & { businessField?: string })

    expect(mapped.businessArea).toBe('디지털리터러시')
  })

  it('등록·수정 사업 기간은 businessStartDate/EndDate로 보낸다', () => {
    const created = toCreateRequest(program)
    const updated = toUpdateRequest(program, {
      startDate: '2026-10-14',
      endDate: '2026-11-07',
    })
    expect(created.businessStartDate).toBe(program.startDate)
    expect(created.businessEndDate).toBe(program.endDate)
    expect(updated.businessStartDate).toBe('2026-10-14')
    expect(updated.businessEndDate).toBe('2026-11-07')
  })

  it('사업 분야는 공식 businessArea만 생성·수정 요청에 보낸다', () => {
    const changed = { ...program, businessArea: 'digital_literacy' }
    const created = toCreateRequest(changed)
    const updated = toUpdateRequest(changed, {
      businessArea: 'digital_literacy',
    })

    expect(created.businessArea).toBe('디지털리터러시')
    expect(created).not.toHaveProperty('businessField')
    expect(updated.businessArea).toBe('디지털리터러시')
    expect(updated).not.toHaveProperty('businessField')
  })

  it('사업 기간은 연도를 넘어도 선택한 날짜를 그대로 보낸다', () => {
    const span: Program = {
      ...program,
      startDate: '2025-03-31T15:00:00.000Z',
      endDate: '2027-08-23T14:59:59.999Z',
    }
    const created = toCreateRequest(span)
    const updated = toUpdateRequest(span, {
      startDate: span.startDate,
      endDate: span.endDate,
    })
    expect(created.startDate).toBe(span.startDate)
    expect(created.endDate).toBe(span.endDate)
    expect(created.businessStartDate).toBe(span.startDate)
    expect(created.businessEndDate).toBe(span.endDate)
    expect(updated.businessStartDate).toBe(span.startDate)
    expect(updated.businessEndDate).toBe(span.endDate)
  })
})

describe('UJAT detailedProgramId·detailedProgramName (id·name 둘 다 삽입, 버그 수정 확인)', () => {
  it('detailedProgramId를 숫자로 요청에 실어 보낸다 (실제 카탈로그를 고른 경우)', () => {
    const withCatalog: Program = {
      ...program,
      detailedProgramId: '163006',
      generalCommonInfo: { detailedProgramName: '실제 선택한 세부 프로그램명' },
    }
    const request = toCreateRequest(withCatalog)
    expect(request.detailedProgramId).toBe(163006)
  })

  it('UJAT 고정 sentinel(카탈로그 미사용)이면 detailedProgramId는 null이지만 name은 보존된다', () => {
    const withSentinel: Program = {
      ...program,
      detailedProgramId: '__ujat_volunteer_core__',
      teamDivision: '대학생경제교육봉사단',
      generalCommonInfo: { detailedProgramName: '대학생경제교육봉사단' },
    }
    const request = toCreateRequest(withSentinel)
    expect(request.detailedProgramId).toBeUndefined()

    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: { generalCommonInfo?: { detailedProgramName?: string } }
    }
    expect(detail.program?.generalCommonInfo?.detailedProgramName).toBe('대학생경제교육봉사단')
  })

  it('상세 serviceDetailJson.registration.overlay를 화면용으로 붙인다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: JSON.stringify({
        version: 1,
        program: {},
        registration: {
          draft: draft,
          overlay: {
            'ujat.basicInfo.repEn': 'Local Spending and Saving',
            'ujat.kpi.participantCount': 61,
          },
        },
      }),
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.repEn']).toBe(
      'Local Spending and Saving'
    )
    expect(mapped.ujatRegistrationOverlay?.['ujat.kpi.participantCount']).toBe(61)
  })

  it('기본 semesterCalendars의 교육일정을 등록 화면 overlay로 매핑한다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: JSON.stringify({
        semesterCalendars: {
          FIRST_HALF: {
            preTrainingDate: '2026-07-07',
            educationFridays: ['2026-07-17', '2026-07-24'],
            closingDate: '2026-08-21',
            blockedDates: ['2026-07-20'],
            mode: 'none',
          },
        },
      }),
    })

    expect(mapped.ujatRegistrationOverlay?.['ujat.h1.pre.multi']).toEqual({
      rowIds: [0],
      regionByRow: { '0': [] },
      dateByRow: { '0': '2026-07-07' },
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.h1.event.range']).toEqual({
      start: '2026-07-17',
      end: '2026-07-24',
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.h1.closing.multi']).toEqual({
      rowIds: [0],
      regionByRow: { '0': [] },
      dateByRow: { '0': '2026-08-21' },
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.h1.eduSchedule.unavailableDates']).toEqual([
      '2026-07-20',
    ])
  })

  it('상세 응답 KPI와 serviceDetailJson 지역 정원을 canonical source로 매핑한다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      generalVolunteers: 60,
      instructors: 0,
      finalSchools: 30,
      finalClasses: 30,
      educationProcess: null as unknown as string,
      serviceDetailJson: JSON.stringify({
        ujatRegionCapacities: {
          FIRST_HALF: { SEOUL: { maxSchools: 20, maxVolunteers: 40 } },
          SECOND_HALF: { SEOUL: { maxSchools: 24, maxVolunteers: 48 } },
        },
        registration: {
          overlay: {
            'ujat.kpi.volunteer': 999,
            'ujat.capacity.byRegion': { h1: { 서울: { classCount: '999' } } },
            'ujat.basicInfo.ipOwned': 'ja',
            'ujat.basicInfo.partnerInvolvement': 'no',
            'ujat.basicInfo.detailedProgramId': '__stale__',
          },
        },
      }),
    })

    expect(mapped.ujatRegistrationOverlay).toMatchObject({
      'ujat.kpi.instructor': 0,
      'ujat.kpi.volunteer': 60,
      'ujat.kpi.dispatchedSchool': 30,
      'ujat.kpi.dispatchedClass': 30,
      'ujat.capacity.byRegion': {
        h1: { 서울: { classCount: '20', volunteerCount: '40' } },
        h2: { 서울: { classCount: '24', volunteerCount: '48' } },
      },
      'ujat.basicInfo.educationCourse': '',
      'ujat.basicInfo.ipOwned': 'ja',
      'ujat.basicInfo.partnerInvolvement': 'no',
      'ujat.basicInfo.detailedProgramId': '__stale__',
    })
    expect(mapped.generalCommonInfo?.kpi).toEqual({
      finalParticipants: undefined,
      instructorCount: 0,
      volunteerCount: 60,
      finalSchools: 30,
      finalClasses: 30,
    })
  })

  it('빈 title·null KPI는 대표명·시드로 채우지 않고 extras 없으면 overlay 정원을 유지한다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: '',
      mainTitle: null,
      titleEn: null,
      businessArea: null,
      totalParticipants: null,
      finalClasses: 0,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: JSON.stringify({
        registration: {
          overlay: {
            'ujat.capacity.byRegion': {
              h1: { 서울: { classCount: '3', volunteerCount: '6' } },
            },
            'ujat.wage.paymentItemValues': [],
          },
        },
      }),
    } as unknown as Parameters<typeof fromDetail>[0])
    expect(mapped.title).toBe('')
    expect(mapped.mainTitle).toBe('')
    expect(mapped.titleEn == null || mapped.titleEn === '').toBe(true)
    expect(mapped.totalParticipants == null).toBe(true)
    expect(mapped.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: null,
      finalClasses: 0,
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.capacity.byRegion']).toEqual({
      h1: { 서울: { classCount: '3', volunteerCount: '6' } },
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.wage.paymentItemValues']).toEqual([])
  })

  it('등록 overlay 모집 공고명·설명을 create body와 상세 매핑에 남긴다', () => {
    const pending = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-pending-recruit',
      overlay: {
        'ujat.basicInfo.repKo': '대학생경제교육봉사단',
        'ujat.recruit.institution.publicTitle': '등록한 기관 공고',
        'ujat.recruit.institution.description': '등록한 프로그램 설명',
        'ujat.recruit.volunteer.h1.publicTitle': '등록한 상반기 공고',
      },
    })
    const request = toCreateRequest(pending, {
      draft,
      overlay: pending.ujatRegistrationOverlay ?? {},
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(detail.registration?.overlay?.['ujat.recruit.institution.publicTitle']).toBe(
      '등록한 기관 공고'
    )
    expect(request.recruitments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recruitmentType: 'PARTICIPANT',
          announcementTitle: '등록한 기관 공고',
          programDescription: '등록한 프로그램 설명',
        }),
        expect.objectContaining({
          recruitmentType: 'VOLUNTEER',
          announcementTitle: '등록한 상반기 공고',
        }),
      ])
    )

    const mapped = fromDetail({
      id: '186200',
      sponsorId: pending.sponsorId,
      title: pending.title,
      startDate: String(pending.startDate),
      endDate: String(pending.endDate),
      serviceDetailJson: request.serviceDetailJson,
      recruitments: request.recruitments as Parameters<typeof fromDetail>[0]['recruitments'],
    })
    expect(resolveUjatRecruitAnnouncementTitle(mapped, 'institution')).toBe('등록한 기관 공고')
    expect(resolveUjatRecruitAnnouncementTitle(mapped, 'volunteer_h1')).toBe('등록한 상반기 공고')
  })

  it('BE top-level 대표·관리명·해당없음이 stale overlay보다 우선한다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: '새 관리명',
      mainTitle: '새 국문 대표명',
      titleEn: 'New English Title',
      detailedProgramName: '해당없음',
      detailedProgramId: undefined,
      educationStructure: 'SCHEDULE',
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: JSON.stringify({
        version: 1,
        program: {},
        registration: {
          draft,
          overlay: {
            'ujat.basicInfo.repKo': '옛 국문',
            'ujat.basicInfo.repEn': 'Old English',
            'ujat.basicInfo.programManagementName': '옛 관리명',
            'ujat.basicInfo.detailedProgramId': '__ujat_volunteer_core__',
            'ujat.basicInfo.detailedProgramName': '대학생경제교육봉사단',
          },
        },
      }),
    })
    expect(mapped.title).toBe('새 관리명')
    expect(mapped.mainTitle).toBe('새 국문 대표명')
    expect(mapped.titleEn).toBe('New English Title')
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.repKo']).toBe('새 국문 대표명')
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.repEn']).toBe('New English Title')
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.programManagementName']).toBe(
      '새 관리명'
    )
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.detailedProgramName']).toBe('해당없음')
    expect(mapped.generalProgramEducationStructure).toBe('schedule')
  })

  it('응답의 detailedProgramId·detailedProgramName을 Program에 round-trip 한다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      detailedProgramId: 163006,
      detailedProgramName: '실제 선택한 세부 프로그램명',
    })
    expect(mapped.detailedProgramId).toBe('163006')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
  })
})

describe('UJAT create — overlay 1차 컬럼 반영 (버그 수정 확인)', () => {
  it('등록 스냅샷 create 요청에 영문명·사업분야·IP·모집기간을 실어 보낸다', () => {
    const created = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-pending-1',
      overlay: {
        'ujat.basicInfo.repKo': '우리 동네 소비와 저축',
        'ujat.basicInfo.repEn': 'Local Spending and Saving',
        'ujat.basicInfo.programManagementName': '우리 동네 소비와 저축 운영',
        'ujat.basicInfo.businessField': 'digital_literacy',
        'ujat.basicInfo.ipOwned': 'jointly',
        'ujat.basicInfo.courseDeliveredBy': 'ja',
        'ujat.basicInfo.partnerInvolvement': 'yes',
        'ujat.basicInfo.educationCourse': 'digital_computer',
        'ujat.recruit.institution.recruitRange': {
          start: '2026-11-10T15:00:00.000Z',
          end: '2026-11-24T15:00:00.000Z',
        },
        'ujat.recruit.institution.contact': {
          name: '정민재',
          phone: '031-234-5678',
          email: 'edu.team@jakorea.org',
        },
      },
    })
    const request = toCreateRequest(created, {
      draft,
      overlay: { 'ujat.basicInfo.repEn': 'Local Spending and Saving' },
    })

    expect(request.titleEn).toBe('Local Spending and Saving')
    expect(request.businessArea).toBe('디지털리터러시')
    expect(request.ipOwned).toBe('Jointly')
    expect(request.courseDeliveredBy).toBe('JA')
    expect(request.partnerInvolvement).toBe(true)
    expect(request.educationProcess).toBe('digital_computer')
    expect(request.applicationStartDate).toBe('2026-11-10T15:00:00.000Z')
    expect(request.applicationEndDate).toBe('2026-11-24T15:00:00.000Z')
    expect(request.recruitments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          startAt: '2026-11-10T15:00:00.000Z',
          endAt: '2026-11-24T15:00:00.000Z',
        }),
        expect.objectContaining({
          recruitmentType: 'VOLUNTEER',
          targetType: 'COLLEGE_STUDENT',
        }),
      ])
    )
    expect(request.managerName).toBe('정민재')
    expect(request.contactPhone).toBe('031-234-5678')
    expect(request.contactEmail).toBe('edu.team@jakorea.org')
  })

  it('사업 시작 전 기관 모집일은 application* 대신 recruitments에만 실는다', () => {
    const created = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-pending-recruit-before-biz',
      overlay: {
        'ujat.basicInfo.operationRangeSeal': {
          start: '2026-10-08T15:00:00.000Z',
          end: '2026-11-01T15:00:00.000Z',
        },
        'ujat.recruit.institution.recruitRange': {
          start: '2026-10-03T15:00:00.000Z',
          end: '2026-10-07T15:00:00.000Z',
        },
        'ujat.recruit.volunteer.h1.recruitRange': {
          start: '2026-10-03T15:00:00.000Z',
          end: '2026-10-07T15:00:00.000Z',
        },
      },
    })
    const request = toCreateRequest(created, {
      draft,
      overlay: created.ujatRegistrationOverlay ?? {},
    })

    expect(request.applicationStartDate).toBeUndefined()
    expect(request.applicationEndDate).toBeUndefined()
    expect(request.recruitments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          startAt: '2026-10-03T15:00:00.000Z',
          endAt: '2026-10-07T15:00:00.000Z',
        }),
        expect.objectContaining({
          recruitmentType: 'VOLUNTEER',
          targetType: 'COLLEGE_STUDENT',
          startAt: '2026-10-03T15:00:00.000Z',
          endAt: '2026-10-07T15:00:00.000Z',
        }),
      ])
    )
  })

  it('목록은 관리명(title)과 대표명(mainTitle)을 구분한다', () => {
    const mapped = fromListItem({
      id: 186100,
      title: '프로그램 관리명',
      mainTitle: '우리 동네 소비와 저축',
    })

    expect(mapped.title).toBe('프로그램 관리명')
    expect(mapped.mainTitle).toBe('우리 동네 소비와 저축')
  })

  it('목록 titleEn은 상세와 같은 값을 유지한다', () => {
    const mapped = fromListItem({
      id: 186101,
      title: '프로그램 관리명',
      mainTitle: '우리 동네 소비와 저축',
      titleEn: 'Local Spending',
    })

    expect(mapped.titleEn).toBe('Local Spending')
  })

  it('목록 참여자 모집 인원은 봉사 정원을 쓰지 않는다', () => {
    const mapped = fromListItem({
      id: 182101,
      title: 'UJAT',
      participantApprovedCount: 2,
      participantRecruitmentCount: 15,
      volunteerRecruitmentCount: 40,
      volunteerApprovedCount: 33,
      applicantCount: 9,
    })
    expect(mapped.participantApprovedCount).toBe(2)
    expect(mapped.participantCapacity).toBe(15)
  })
})

describe('UJAT API policy', () => {
  it('목록 요청은 programType UJAT를 강제한다', () => {
    expect(toRemoteListParams({ businessYear: 2026 })).toEqual({
      programType: 'UJAT',
      businessYear: 2026,
      page: 0,
      size: 20,
    })
  })

  it('4xx는 재시도하지 않고 일시 오류만 최대 1회 재시도한다', () => {
    expect(shouldRetryQuery(0, { response: { status: 422 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 503 } })).toBe(true)
    expect(shouldRetryQuery(1, { response: { status: 503 } })).toBe(true)
    expect(shouldRetryQuery(2, { response: { status: 503 } })).toBe(false)
  })
})

describe('mapUjatProgramRecruitmentsToRequest', () => {
  it('봉사자 정원이 0이어도 maxCount를 보낸다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({
      ...program,
      ujatFirstHalfVolunteerCount: 0,
      volunteerApplicationStartDate: '2026-03-01T00:00:00+09:00',
      volunteerApplicationEndDate: '2026-03-31T00:00:00+09:00',
    })
    expect(rows?.find(row => row.recruitmentType === 'VOLUNTEER')?.maxCount).toBe(0)
  })

  it('프로그램 봉사자 기간은 상반기 행에만 넣고 하반기 행은 보내지 않는다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({
      ...program,
      applicationStartDate: '2026-02-01T00:00:00+09:00',
      applicationEndDate: '2026-02-28T00:00:00+09:00',
      volunteerApplicationStartDate: '2026-03-01T00:00:00+09:00',
      volunteerApplicationEndDate: '2026-03-31T00:00:00+09:00',
      rounds: [
        {
          id: 'r1',
          programId: program.id,
          roundNumber: 1,
          startDate: '2026-09-01T00:00:00+09:00',
          endDate: '2026-09-30T00:00:00+09:00',
          status: 'active',
        },
        {
          id: 'r2',
          programId: program.id,
          roundNumber: 2,
          startDate: '2026-10-01T00:00:00+09:00',
          endDate: '2026-10-31T00:00:00+09:00',
          status: 'active',
        },
      ],
      programRecruitments: [
        {
          id: 182211,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-02-01T00:00:00+09:00',
        },
        {
          id: 182212,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          startAt: '2026-03-01T00:00:00+09:00',
          endAt: '2026-03-31T00:00:00+09:00',
        },
        {
          id: 182213,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          startAt: '2026-08-01T00:00:00+09:00',
          endAt: '2026-08-31T00:00:00+09:00',
        },
      ],
    })
    const h1 = rows.find(row => row.id === 182212)
    expect(h1?.startAt).toBe('2026-03-01T00:00:00+09:00')
    expect(h1?.endAt).toBe('2026-03-31T00:00:00+09:00')
    expect(h1?.recruitTerm).toBe('FIRST_HALF')
    expect(rows.some(row => row.id === 182213)).toBe(false)
  })

  it('봉사자 행은 recruitTerm FIRST_HALF 행을 상반기로 쓰고 기관 행에는 recruitTerm을 보내지 않는다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({
      ...program,
      programRecruitments: [
        { id: 1, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
        {
          id: 2,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          startAt: '2026-01-01T00:00:00+09:00',
        },
        {
          id: 3,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
          startAt: '2026-03-01T00:00:00+09:00',
        },
      ],
    })
    const volunteer = rows.find(row => row.recruitmentType === 'VOLUNTEER')
    expect(volunteer).toMatchObject({ id: 3, recruitTerm: 'FIRST_HALF' })
    expect(rows.find(row => row.recruitmentType === 'PARTICIPANT')?.recruitTerm).toBeUndefined()
  })

  it('신규 생성 시에도 봉사자 행에 recruitTerm FIRST_HALF를 보낸다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({ ...program, programRecruitments: undefined })
    const volunteer = rows.find(row => row.recruitmentType === 'VOLUNTEER')
    expect(volunteer?.id).toBeUndefined()
    expect(volunteer?.recruitTerm).toBe('FIRST_HALF')
  })

  it('typed recruitment rows에 있는 SECOND_HALF는 별도 행으로 보낸다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({
      ...program,
      programRecruitments: [
        { recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' },
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          startAt: '2027-08-01T00:00:00Z',
          endAt: '2027-08-31T23:59:59Z',
          interviewEnabled: true,
        },
      ],
    })
    expect(rows.filter(row => row.recruitmentType === 'VOLUNTEER')).toHaveLength(2)
    expect(rows.find(row => row.recruitTerm === 'SECOND_HALF')).toMatchObject({
      startAt: '2027-08-01T00:00:00Z',
      endAt: '2027-08-31T23:59:59Z',
      interviewEnabled: true,
    })
  })

  it('신규 UJAT 생성 요청은 기관·H1·H2 typed 행의 상세 문구와 ID를 보존한다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({
      ...program,
      applicationStartDate: '2027-01-01T00:00:00Z',
      applicationEndDate: '2027-01-31T00:00:00Z',
      programRecruitments: [
        {
          id: 301,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          announcementTitle: '기관 공고',
          programDescription: '기관 설명',
          recruitmentGuide: '기관 안내',
          contactName: '기관 담당',
          contactPhone: '010-1111-1111',
          contactEmail: 'institution@example.com',
        },
        {
          id: 302,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
          startAt: '2027-02-01T00:00:00Z',
          endAt: '2027-02-28T00:00:00Z',
          announcementTitle: 'H1 공고',
          otherMatters: 'H1 안내',
        },
        {
          id: 303,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          announcementTitle: 'H2 공고',
          programDescription: 'H2 설명',
        },
      ],
    })

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 301,
          applicationType: 'ORGANIZATION',
          announcementTitle: '기관 공고',
          programDescription: '기관 설명',
          recruitmentGuide: '기관 안내',
          contactName: '기관 담당',
        }),
        expect.objectContaining({
          id: 302,
          recruitTerm: 'FIRST_HALF',
          announcementTitle: 'H1 공고',
          otherMatters: 'H1 안내',
        }),
        expect.objectContaining({
          id: 303,
          recruitTerm: 'SECOND_HALF',
          announcementTitle: 'H2 공고',
          programDescription: 'H2 설명',
        }),
      ])
    )
  })

  it('봉사자 행에 면접 필수와 상반기 면접 기간을 보낸다', () => {
    const rows = mapUjatProgramRecruitmentsToRequest({
      ...program,
      interviewStartDate: '2026-04-01T00:00:00+09:00',
      interviewEndDate: '2026-04-15T00:00:00+09:00',
      programRecruitments: [
        {
          id: 3,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
          interviewStartAt: '2026-04-01T00:00:00+09:00',
          interviewEndAt: '2026-04-15T00:00:00+09:00',
        },
      ],
    })
    const volunteer = rows.find(row => row.recruitmentType === 'VOLUNTEER')
    expect(volunteer).toMatchObject({
      interviewEnabled: true,
      interviewStartAt: '2026-04-01T00:00:00+09:00',
      interviewEndAt: '2026-04-15T00:00:00+09:00',
    })
    expect(
      rows.find(row => row.recruitmentType === 'PARTICIPANT')?.interviewEnabled
    ).toBeUndefined()
  })
})

describe('buildUjatNewVolunteerHalfRowRequests', () => {
  const existing: Program = {
    ...program,
    programRecruitments: [{ id: 10, recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' }],
  }

  it('저장되지 않은 하반기 행을 id 없이 SECOND_HALF로 보낸다', () => {
    const rows = buildUjatNewVolunteerHalfRowRequests(
      [
        ...(existing.programRecruitments ?? []),
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          startAt: '2026-08-01T00:00:00',
          endAt: '2026-08-31T23:59:59',
          announcementTitle: '하반기 모집',
        },
      ],
      existing
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      recruitmentType: 'VOLUNTEER',
      targetType: 'COLLEGE_STUDENT',
      applicationType: 'VOLUNTEER',
      recruitTerm: 'SECOND_HALF',
      startAt: '2026-08-01T00:00:00',
      announcementTitle: '하반기 모집',
    })
    expect(rows[0]).not.toHaveProperty('id')
  })

  it('상반기 모집이 시작해도 하반기 신규 행을 빼지 않는다', () => {
    const rows = buildUjatNewVolunteerHalfRowRequests(
      [
        {
          id: 10,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
          startAt: '2020-01-01T00:00:00+09:00',
          operationStartDate: '2020-02-01',
        },
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          startAt: '2026-08-01T00:00:00',
        },
      ],
      {
        ...existing,
        programRecruitments: [
          {
            id: 10,
            recruitmentType: 'VOLUNTEER',
            recruitTerm: 'FIRST_HALF',
            startAt: '2020-01-01T00:00:00+09:00',
            operationStartDate: '2020-02-01',
          },
        ],
      }
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ recruitTerm: 'SECOND_HALF' })
    expect(rows[0]).not.toHaveProperty('id')
  })

  it('하반기를 추가할 때 저장된 상반기 id를 함께 보낸다', () => {
    const request = toUpdateRequest(existing, {
      programRecruitments: [
        ...(existing.programRecruitments ?? []),
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          startAt: '2026-08-01T00:00:00',
        },
      ],
    })
    expect(request.recruitments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
        }),
        expect.objectContaining({
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
        }),
      ])
    )
    expect(request.recruitments?.find(row => row.recruitTerm === 'SECOND_HALF')).not.toHaveProperty(
      'id'
    )
  })

  it('이미 저장된 반기는 새 행으로 보내지 않는다', () => {
    const rows = buildUjatNewVolunteerHalfRowRequests(
      [{ recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' }],
      existing
    )
    expect(rows).toHaveLength(0)
  })
})

describe('toCreateRequest — UJAT 상·하반기 봉사자 모집 행 (수동 등록 위저드 overlay)', () => {
  const H1_RECRUIT = { start: '2027-01-10T15:00:00.000Z', end: '2027-01-28T15:00:00.000Z' }
  const H1_INTERVIEW = { start: '2027-02-04T15:00:00.000Z', end: '2027-02-06T15:00:00.000Z' }
  const H2_RECRUIT = { start: '2027-07-11T15:00:00.000Z', end: '2027-07-29T15:00:00.000Z' }
  const H2_INTERVIEW = { start: '2027-08-05T15:00:00.000Z', end: '2027-08-07T15:00:00.000Z' }

  /** 위저드 모집 탭이 저장하는 반기 키 형태 그대로 */
  function wizardOverlay(options: { h2?: boolean; h1Interview?: boolean } = {}) {
    const h2 = options.h2 ?? true
    return {
      'ujat.basicInfo.programManagementName': '2027 UJAT 수동 등록',
      'ujat.basicInfo.operationRangeSeal': {
        start: '2027-02-28T15:00:00.000Z',
        end: '2027-12-31T14:59:59.999Z',
      },
      'ujat.recruit.institution.announcementPublished': true,
      'ujat.recruit.institution.publicTitle': '2027 UJAT 참여 학교 모집',
      'ujat.recruit.institution.recruitRange': {
        start: '2027-01-03T15:00:00.000Z',
        end: '2027-02-11T15:00:00.000Z',
      },
      'ujat.recruit.volunteer.h1.announcementPublished': true,
      'ujat.recruit.volunteer.h1.publicTitle': '2027 UJAT 상반기 봉사자 모집',
      ...(options.h1Interview === false
        ? {}
        : { 'ujat.recruit.volunteer.h1.interviewRange': H1_INTERVIEW }),
      'ujat.recruit.volunteer.h1.recruitRange': H1_RECRUIT,
      ...(h2
        ? {
            'ujat.recruit.volunteer.h2.announcementPublished': true,
            'ujat.recruit.volunteer.h2.publicTitle': '2027 UJAT 하반기 봉사자 모집',
            'ujat.recruit.volunteer.h2.noticeExposure': 'one-week-before',
            'ujat.recruit.volunteer.h2.interviewRange': H2_INTERVIEW,
            'ujat.recruit.volunteer.h2.recruitRange': H2_RECRUIT,
          }
        : {}),
    }
  }

  function create(overlay: Record<string, unknown>) {
    const pending = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-pending-manual',
      overlay,
    })
    return toCreateRequest(pending, { draft, overlay })
  }

  it('기관·H1·H2 행을 각각 만들고 반기별 모집·면접 기간을 해당 행에만 싣는다', () => {
    const rows = create(wizardOverlay()).recruitments ?? []
    expect(rows.map(row => [row.recruitmentType, row.recruitTerm ?? null])).toEqual([
      ['PARTICIPANT', null],
      ['VOLUNTEER', 'FIRST_HALF'],
      ['VOLUNTEER', 'SECOND_HALF'],
    ])
    const h1 = rows[1]
    const h2 = rows[2]
    expect(h1).toMatchObject({
      status: 'ACTIVE',
      applicationType: 'VOLUNTEER',
      targetType: 'COLLEGE_STUDENT',
      interviewEnabled: true,
      startAt: H1_RECRUIT.start,
      endAt: H1_RECRUIT.end,
      interviewStartAt: H1_INTERVIEW.start,
      interviewEndAt: H1_INTERVIEW.end,
      announcementTitle: '2027 UJAT 상반기 봉사자 모집',
    })
    expect(h2).toMatchObject({
      status: 'ACTIVE',
      applicationType: 'VOLUNTEER',
      targetType: 'COLLEGE_STUDENT',
      interviewEnabled: true,
      startAt: H2_RECRUIT.start,
      endAt: H2_RECRUIT.end,
      interviewStartAt: H2_INTERVIEW.start,
      interviewEndAt: H2_INTERVIEW.end,
      announcementTitle: '2027 UJAT 하반기 봉사자 모집',
    })
    expect(h2).not.toHaveProperty('id')
  })

  it('기관 모집 행은 기존 계약(면접 필드 없음·recruitTerm 없음)을 유지한다', () => {
    const institution = create(wizardOverlay()).recruitments?.[0]
    expect(institution).toMatchObject({
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      applicationType: 'ORGANIZATION',
      status: 'ACTIVE',
      startAt: '2027-01-03T15:00:00.000Z',
      endAt: '2027-02-11T15:00:00.000Z',
      announcementTitle: '2027 UJAT 참여 학교 모집',
    })
    expect(institution).not.toHaveProperty('recruitTerm')
    expect(institution).not.toHaveProperty('interviewEnabled')
    expect(institution).not.toHaveProperty('interviewStartAt')
    expect(institution).not.toHaveProperty('interviewEndAt')
  })

  it('하반기 입력이 없으면 H2 행을 만들지 않고 상반기 값을 복사하지 않는다', () => {
    const rows = create(wizardOverlay({ h2: false })).recruitments ?? []
    expect(rows.map(row => row.recruitTerm ?? null)).toEqual([null, 'FIRST_HALF'])
  })

  it('H1 면접 기간이 없으면 다른 반기·레거시 공용 키 값으로 채우지 않는다', () => {
    const rows =
      create({
        ...wizardOverlay({ h1Interview: false }),
        'ujat.recruit.volunteer.interviewRange': {
          start: '2026-01-01T00:00:00.000Z',
          end: '2026-01-02T00:00:00.000Z',
        },
      }).recruitments ?? []
    const h1 = rows.find(row => row.recruitTerm === 'FIRST_HALF')
    expect(h1).toMatchObject({ interviewEnabled: true })
    expect(h1).not.toHaveProperty('interviewStartAt')
    expect(h1).not.toHaveProperty('interviewEndAt')
    const h2 = rows.find(row => row.recruitTerm === 'SECOND_HALF')
    expect(h2?.interviewStartAt).toBe(H2_INTERVIEW.start)
  })

  it('typed 행의 운영기간이 있으면 Overlay programRange로 덮지 않는다', () => {
    const request = toCreateRequest(
      {
        ...program,
        ujatRegistrationOverlay: {
          'ujat.recruit.institution.programRange': {
            start: '2020-01-01',
            end: '2020-12-31',
          },
          'ujat.recruit.volunteer.programRange': {
            start: '2020-01-01',
            end: '2020-12-31',
          },
        },
        programRecruitments: [
          {
            recruitmentType: 'PARTICIPANT',
            applicationType: 'ORGANIZATION',
            announcementTitle: '기관 공고',
            operationStartDate: '2027-03-01',
            operationEndDate: '2027-12-31',
          },
          {
            recruitmentType: 'VOLUNTEER',
            applicationType: 'VOLUNTEER',
            recruitTerm: 'FIRST_HALF',
            announcementTitle: 'H1 공고',
            operationStartDate: '2027-03-01',
            operationEndDate: '2027-06-30',
          },
        ],
      },
      { draft, overlay: {} }
    )
    expect(request.recruitments?.find(row => row.recruitmentType === 'PARTICIPANT')).toMatchObject({
      operationStartDate: '2027-03-01',
      operationEndDate: '2027-12-31',
    })
    expect(request.recruitments?.find(row => row.recruitTerm === 'FIRST_HALF')).toMatchObject({
      operationStartDate: '2027-03-01',
      operationEndDate: '2027-06-30',
    })
  })
})
