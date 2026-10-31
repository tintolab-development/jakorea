import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  resolveUjatDevAutofillDefaultBusinessYear,
  UJAT_DEV_AUTOFILL_CASE_IDS,
  UJAT_DEV_AUTOFILL_CASE_LABELS,
} from './dev-autofill-cases'
import {
  buildUjatDevAutofillFixture,
  listAvailableEducationFridays,
  listFridaysInRange,
  type ResolvedUjatDevDependencies,
  type UjatDevAutofillFixture,
} from './dev-autofill-fixture'
import { validateUjatDevAutofillFixture } from './dev-autofill-validate'
import { ujatHalfScheduleOverlayKeys } from './ujat-half-education-schedule-types'
import { ujatEducationScheduleSettingsOverlayKeys } from './ujat-education-schedule-settings-types'
import { UJAT_REGION_CAPACITY_OVERLAY_KEY } from './ujat-region-capacity-types'
import { ujatVolunteerHalfOverlayKey } from './ujat-recruit-volunteer-half-overlay'

const REGIONS = [
  { key: 'SEOUL', label: '서울' },
  { key: 'GYEONGGI_SOUTH', label: '경기(남부)' },
  { key: 'INCHEON', label: '인천' },
  { key: 'DAEJEON', label: '대전' },
  { key: 'DAEGU', label: '대구' },
  { key: 'BUSAN', label: '부산' },
  { key: 'GWANGJU', label: '광주' },
  { key: 'JEONBUK', label: '전북(전주)' },
]

function deps(overrides: Partial<ResolvedUjatDevDependencies> = {}): ResolvedUjatDevDependencies {
  return {
    regions: REGIONS,
    sponsor: { sponsorId: '1001', contactId: '2001' },
    instructorId: '501',
    paymentItemValues: ['p-1'],
    holidayDateKeys: new Set(),
    ...overrides,
  }
}

const YEAR = 2026

function build(caseId: (typeof UJAT_DEV_AUTOFILL_CASE_IDS)[number], d = deps()): UjatDevAutofillFixture {
  return buildUjatDevAutofillFixture({ caseId, businessYear: YEAR }, d)
}

describe('UJAT DEV 자동입력 케이스 목록', () => {
  it('정상 등록 프리셋 6개만 노출한다', () => {
    expect(UJAT_DEV_AUTOFILL_CASE_IDS).toEqual(['REG-01', 'REG-02', 'REG-03', 'REG-04', 'REG-05', 'REG-06'])
    expect(Object.values(UJAT_DEV_AUTOFILL_CASE_LABELS).some(label => label.startsWith('NEG'))).toBe(false)
  })

  it('기본 사업 연도는 2026으로 고정한다', () => {
    expect(resolveUjatDevAutofillDefaultBusinessYear(new Date('2026-10-20T12:00:00'))).toBe(2026)
    expect(resolveUjatDevAutofillDefaultBusinessYear(new Date('2027-03-02T00:00:00'))).toBe(2026)
  })
})

describe.each(UJAT_DEV_AUTOFILL_CASE_IDS)('%s Fixture 공통 불변식', caseId => {
  it('결정적이다 — 같은 케이스·연도·참조 데이터면 같은 값', () => {
    expect(build(caseId)).toEqual(build(caseId))
  })

  it('도메인 검증 오류가 없다', () => {
    expect(validateUjatDevAutofillFixture(build(caseId))).toEqual([])
  })

  it('사업 기간은 같은 연도이고 반기 본교육은 그 안에서 서로 다르다', () => {
    const { plan } = build(caseId)
    expect(dayjs(plan.business.start).year()).toBe(YEAR)
    expect(dayjs(plan.business.end).year()).toBe(YEAR)
    expect(plan.halves.h1.event).not.toEqual(plan.halves.h2.event)
    expect(dayjs(plan.halves.h1.event.end).isBefore(dayjs(plan.halves.h2.event.start))).toBe(true)
  })

  it('모집·면접·발표·사전/해단식 일정이 사업 기간 안에 있다', () => {
    const { plan } = build(caseId)
    const start = dayjs(plan.business.start)
    const end = dayjs(plan.business.end)
    const inside = (key: string) => {
      expect(dayjs(key).isBefore(start, 'day'), key).toBe(false)
      expect(dayjs(key).isAfter(end, 'day'), key).toBe(false)
    }
    inside(plan.institution.recruit.start)
    inside(plan.institution.recruit.end)
    inside(plan.institution.resultAnnounce)
    for (const half of ['h1', 'h2'] as const) {
      const row = plan.halves[half]
      inside(row.recruit.start)
      inside(row.recruit.end)
      inside(row.docAnnounce)
      inside(row.interview.start)
      inside(row.interview.end)
      inside(row.finalAnnounce)
      inside(row.event.start)
      inside(row.event.end)
      row.preDates.forEach(inside)
      row.closingDates.forEach(inside)
    }
  })

  it('봉사자 H1/H2 모집·면접 기간이 서로 다르고 면접 시작 ≤ 종료', () => {
    const { plan, recruitVolunteer } = build(caseId)
    expect(plan.halves.h1.interview).not.toEqual(plan.halves.h2.interview)
    expect(plan.halves.h1.recruit).not.toEqual(plan.halves.h2.recruit)
    for (const half of ['h1', 'h2'] as const) {
      const range = plan.halves[half].interview
      expect(dayjs(range.start).isAfter(dayjs(range.end))).toBe(false)
      expect(recruitVolunteer[ujatVolunteerHalfOverlayKey(half, 'interviewRange')]).toEqual({
        start: dayjs(range.start).startOf('day').toISOString(),
        end: dayjs(range.end).startOf('day').toISOString(),
      })
    }
  })

  it('본교육 시작·종료와 신청 가능 날짜는 금요일이고 최소 1일 남는다', () => {
    const { plan } = build(caseId)
    for (const half of ['h1', 'h2'] as const) {
      const fridays = listFridaysInRange(plan.halves[half].event)
      expect(fridays.every(day => dayjs(day).day() === 5)).toBe(true)
      expect(dayjs(plan.halves[half].event.start).day()).toBe(5)
      expect(dayjs(plan.halves[half].event.end).day()).toBe(5)
      expect(listAvailableEducationFridays(plan.halves[half], new Set()).length).toBeGreaterThan(0)
    }
  })

  it('불가일 「없음」과 다른 옵션을 함께 고르지 않는다', () => {
    const { plan } = build(caseId)
    for (const half of ['h1', 'h2'] as const) {
      const { exclusion, unavailableDates } = plan.halves[half]
      if (exclusion.excludeNone) {
        expect(exclusion.excludeHoliday || exclusion.excludeSaturday || exclusion.excludeSunday).toBe(false)
        expect(unavailableDates).toEqual([])
      }
    }
  })

  it('활성 지역 전체에 반기별 정원을 채우고 sentinel 이외 임의 ID를 만들지 않는다', () => {
    const fixture = build(caseId)
    const capacity = fixture.registration[UJAT_REGION_CAPACITY_OVERLAY_KEY] as Record<
      'h1' | 'h2',
      Record<string, unknown>
    >
    expect(Object.keys(capacity.h1)).toEqual(REGIONS.map(region => region.label))
    expect(Object.keys(capacity.h2)).toEqual(REGIONS.map(region => region.label))
    expect(fixture.registration['ujat.basicInfo.programManagementName']).toBe(
      `DEV-UJAT-${caseId.replace('-', '')}-${YEAR}-샘플01`
    )
    expect(fixture.registration['ujat.basicInfo.sponsorId']).toBe('1001')
    expect(fixture.registration['ujat.basicInfo.sponsorContactId']).toBe('2001')
    expect(fixture.registration['ujat.basicInfo.educationVenueKind']).toBe('inside')
    const preferred = fixture.applicationInstitution.overlay[
      'ujatApplication.preferredScheduleSelectedIds'
    ] as string[]
    expect(preferred).toHaveLength(2)
    expect(preferred[0]).toMatch(/^h1:\d{4}-\d{2}-\d{2}$/)
    expect(preferred[1]).toMatch(/^h2:\d{4}-\d{2}-\d{2}$/)
  })
})

describe('케이스별 특성', () => {
  it('REG-02 — H1/H2 사전교육·해단식·정원·면접 방식이 다르다', () => {
    const fixture = build('REG-02')
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const h2 = ujatHalfScheduleOverlayKeys('h2')
    expect(fixture.registration[h1.preMulti]).not.toEqual(fixture.registration[h2.preMulti])
    expect(fixture.registration[h1.closingMulti]).not.toEqual(fixture.registration[h2.closingMulti])
    expect(fixture.recruitVolunteer[ujatVolunteerHalfOverlayKey('h1', 'interviewMethod')]).not.toBe(
      fixture.recruitVolunteer[ujatVolunteerHalfOverlayKey('h2', 'interviewMethod')]
    )
    const capacity = fixture.registration[UJAT_REGION_CAPACITY_OVERLAY_KEY] as Record<
      'h1' | 'h2',
      Record<string, { classCount: string }>
    >
    expect(capacity.h1['서울']).not.toEqual(capacity.h2['서울'])
    expect(fixture.plan.halves.h1.unavailableDates).toEqual([])
    expect(fixture.plan.halves.h2.unavailableDates).toHaveLength(1)
  })

  it('REG-03 — H2만 D-7 노출 옵션을 갖고 H1에는 노출 옵션이 없다', () => {
    const fixture = build('REG-03')
    expect(fixture.recruitVolunteer[ujatVolunteerHalfOverlayKey('h2', 'noticeExposure')]).toBe(
      'one-week-before'
    )
    expect(ujatVolunteerHalfOverlayKey('h1', 'noticeExposure') in fixture.recruitVolunteer).toBe(false)
    expect(fixture.recruitInstitution['ujat.recruit.institution.announcementPublished']).toBe(true)
  })

  it('REG-04 — H1 직접 불가일 금요일, H2 공휴일 제외. 제외 후에도 신청 가능 금요일이 남는다', () => {
    const fixture = build('REG-04')
    const h1 = fixture.plan.halves.h1
    const h2 = fixture.plan.halves.h2
    expect(h1.unavailableDates).toHaveLength(2)
    expect(h1.unavailableDates.every(day => dayjs(day).day() === 5)).toBe(true)
    const available = listAvailableEducationFridays(h1, new Set())
    expect(available.some(day => h1.unavailableDates.includes(day))).toBe(false)

    expect(h2.exclusion).toMatchObject({ excludeNone: false, excludeHoliday: true })
    const holiday = listFridaysInRange(h2.event)[0]!
    const h2Available = listAvailableEducationFridays(h2, new Set([holiday]))
    expect(h2Available).not.toContain(holiday)
    expect(h2Available.length).toBeGreaterThan(0)

    const settingsKeys = ujatEducationScheduleSettingsOverlayKeys('h1')
    expect(fixture.registration[settingsKeys.unavailableDates]).toEqual(h1.unavailableDates)
  })

  it('REG-05 — H1 JA 진행(강사 없음), H2 강사 섭외(실제 강사 ID)와 다른 교육 형태', () => {
    const fixture = build('REG-05')
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const h2 = ujatHalfScheduleOverlayKeys('h2')
    expect(fixture.registration[h1.preTextbookMode]).toBe('ja')
    expect(h1.preTextbookInstructorId in fixture.registration).toBe(false)
    expect(fixture.registration[h2.preTextbookMode]).toBe('instructor_outsource')
    expect(fixture.registration[h2.preTextbookInstructorId]).toBe('501')
    expect(fixture.registration[h1.eventDelivery]).not.toBe(fixture.registration[h2.eventDelivery])
    expect(fixture.manualInputRequired).toEqual([])
  })

  it('REG-05 — 강사 목록이 없으면 가짜 ID 대신 직접 입력 필요로 표시한다', () => {
    const fixture = build('REG-05', deps({ instructorId: null }))
    expect(ujatHalfScheduleOverlayKeys('h2').preTextbookInstructorId in fixture.registration).toBe(false)
    expect(fixture.manualInputRequired).toContain('h2.pre.textbookInstructorId')
  })

  it('REG-06 — 활성 지역 전체 차등 정원, 복수 학년·실제 반 번호·1~4교시 신청 배열', () => {
    const fixture = build('REG-06')
    const capacity = fixture.registration[UJAT_REGION_CAPACITY_OVERLAY_KEY] as Record<
      'h1' | 'h2',
      Record<string, { classCount: string }>
    >
    const h1Counts = new Set(Object.values(capacity.h1).map(row => row.classCount))
    expect(h1Counts.size).toBe(REGIONS.length)
    const editorState = fixture.applicationInstitution.editorState as {
      ujatGradeApplicationBlockIds: string[]
      ujatGradeClassTimeBlockIds: string[]
    }
    expect(editorState.ujatGradeApplicationBlockIds).toEqual(['ujat-dev-grade-1', 'ujat-dev-grade-2'])
    const grades = fixture.applicationInstitution.overlay['ujatApplication.gradeDetailByBlock'] as Record<
      string,
      { classNoByIndex: Record<number, string> }
    >
    expect(grades['ujat-dev-grade-1']!.classNoByIndex).toEqual({ 0: '2', 1: '4' })
    const checked = fixture.applicationInstitution.overlay['ujatApplication.classTimeCheckedByBlock'] as Record<
      string,
      Record<string, boolean>
    >
    expect(Object.values(checked).flatMap(row => Object.keys(row)).sort()).toEqual(['1', '2', '3', '4'])
    expect(fixture.applicationVolunteer.editorState).toEqual({ ujatVolunteerApplicationType: 'new' })
    const preMulti = fixture.registration[ujatHalfScheduleOverlayKeys('h1').preMulti] as { rowIds: number[] }
    expect(new Set(preMulti.rowIds).size).toBe(preMulti.rowIds.length)
  })

  it('활성 지역 수만큼만 정원을 만든다 (8개 고정 가정 없음)', () => {
    const fixture = build('REG-01', deps({ regions: REGIONS.slice(0, 3) }))
    const capacity = fixture.registration[UJAT_REGION_CAPACITY_OVERLAY_KEY] as Record<
      'h1',
      Record<string, unknown>
    >
    expect(Object.keys(capacity.h1)).toEqual(['서울', '경기(남부)', '인천'])
    expect(fixture.applicationInstitution.overlay['ujatApplication.applicationRegion']).toBe('서울')
  })

  it('활성 지역이 없으면 「서울」로 채우지 않고 실패한다', () => {
    expect(() => build('REG-01', deps({ regions: [] }))).toThrow(/교육 지역/)
  })
})

describe('Negative — 드롭다운 비노출, 정상 Fixture를 변조', () => {
  function mutate(update: (fixture: UjatDevAutofillFixture) => void): UjatDevAutofillFixture {
    const fixture = structuredClone(build('REG-01'))
    update(fixture)
    return fixture
  }

  it('NEG-01 — 반기 면접 시작/종료 누락은 INTERVIEW_REQUIRED', () => {
    const fixture = mutate(f => {
      f.plan.halves.h2.interview = { start: '', end: '' }
    })
    expect(validateUjatDevAutofillFixture(fixture).map(issue => [issue.code, issue.half])).toContainEqual([
      'INTERVIEW_REQUIRED',
      'h2',
    ])
  })

  it('NEG-02 — 면접 시작일 > 종료일은 INTERVIEW_RANGE_INVERTED', () => {
    const fixture = mutate(f => {
      f.plan.halves.h1.interview = { start: '2027-02-07', end: '2027-02-05' }
    })
    expect(validateUjatDevAutofillFixture(fixture).map(issue => issue.code)).toContain(
      'INTERVIEW_RANGE_INVERTED'
    )
  })

  it('NEG-DATE — 기관 모집이 사업 시작 전이면 DATE_OUTSIDE_BUSINESS', () => {
    const fixture = mutate(f => {
      f.plan.institution.recruit = { start: '2026-01-04', end: '2026-02-12' }
    })
    expect(validateUjatDevAutofillFixture(fixture).map(issue => issue.code)).toContain(
      'DATE_OUTSIDE_BUSINESS'
    )
  })

  it('NEG-03 — 사업 운영 기간이 서로 다른 연도면 BUSINESS_YEAR_MISMATCH', () => {
    const fixture = mutate(f => {
      f.plan.business = { start: '2027-03-01', end: '2028-02-28' }
    })
    expect(validateUjatDevAutofillFixture(fixture).map(issue => issue.code)).toContain(
      'BUSINESS_YEAR_MISMATCH'
    )
  })

  it('H2 면접을 H1 값으로 복제하면 HALF_INTERVIEW_DUPLICATED', () => {
    const fixture = mutate(f => {
      f.plan.halves.h2.interview = { ...f.plan.halves.h1.interview }
    })
    expect(validateUjatDevAutofillFixture(fixture).map(issue => issue.code)).toContain(
      'HALF_INTERVIEW_DUPLICATED'
    )
  })

  it('정상 프리셋 경로에서는 Negative 코드가 생기지 않는다', () => {
    for (const caseId of UJAT_DEV_AUTOFILL_CASE_IDS) {
      expect(validateUjatDevAutofillFixture(build(caseId))).toEqual([])
    }
  })
})
