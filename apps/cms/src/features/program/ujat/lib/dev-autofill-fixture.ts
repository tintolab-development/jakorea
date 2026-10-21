import dayjs, { type Dayjs } from 'dayjs'
import { EDUCATION_TARGET } from '@jakorea/domain/recruitment/education-target'
import type { UjatDevAutofillCaseId } from '@/features/program/ujat/lib/dev-autofill-cases'
import {
  ujatHalfScheduleOverlayKeys,
  type UjatEducationDelivery,
  type UjatHalfMultiScheduleBundle,
  type UjatHalfSemesterKey,
  type UjatTextbookEducationMode,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { ujatEducationScheduleSettingsOverlayKeys } from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import {
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import {
  ujatVolunteerHalfOverlayKey,
  ujatVolunteerRecruitDetailInfoPrefix,
  ujatVolunteerRecruitInterviewNamespace,
  ujatVolunteerRecruitInterviewRangeSealKey,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import {
  UJAT_BASIC_INFO_REP_EN_DEFAULT,
  UJAT_BASIC_INFO_REP_KO_DEFAULT,
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
  type UjatRegionCapacityBySemesterState,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { createUjatSurveyItemsDefault } from '@/features/program/ujat/lib/registration-survey-items'
import type { UjatVolunteerNoticeExposureValue } from '@/features/template/lib/ujat-volunteer-notice-exposure'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import { UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'

const HALVES: readonly UjatHalfSemesterKey[] = ['h1', 'h2']
const IK = UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS
const VK = UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS

export type UjatDevAutofillRegion = { key: string; label: string }

/** 자동입력 전에 GET으로만 모은 참조 데이터 */
export type ResolvedUjatDevDependencies = {
  /** 교육 지역 관리의 사용 중 지역(정렬 순서 그대로) */
  regions: readonly UjatDevAutofillRegion[]
  /** 셀렉트 원값. 「전체」면 UJAT_SPONSOR_ALL_VALUE */
  sponsor: { sponsorId: string; contactId: string }
  /** 강사 섭외에 쓸 실제 강사 회원 id. 조회 불가면 null */
  instructorId: string | null
  /** 정산 설정 카탈로그에 있는 지급 항목 id만 */
  paymentItemValues: readonly string[]
  /** YYYY-MM-DD */
  holidayDateKeys: ReadonlySet<string>
}

export type UjatDevDateRange = { start: string; end: string }

export type UjatDevHalfPlan = {
  /** 본교육 기간 — 시작·종료 모두 금요일 */
  event: UjatDevDateRange
  preDates: string[]
  closingDates: string[]
  recruit: UjatDevDateRange
  docAnnounce: string
  interview: UjatDevDateRange
  finalAnnounce: string
  exclusion: UnavailableDatesExclusionState
  unavailableDates: string[]
}

export type UjatDevDatePlan = {
  business: UjatDevDateRange
  institution: { recruit: UjatDevDateRange; resultAnnounce: string }
  halves: Record<UjatHalfSemesterKey, UjatDevHalfPlan>
}

export type UjatDevAutofillFixture = {
  caseId: UjatDevAutofillCaseId
  businessYear: number
  plan: UjatDevDatePlan
  /** UJAT 공통정보 overlay (기존 자동입력과 같이 모집 키도 포함) */
  registration: Record<string, unknown>
  recruitInstitution: Record<string, unknown>
  recruitVolunteer: Record<string, unknown>
  /** 일반 모집 store의 UJAT sidecar (상세 문구·반기 면접 슬롯) */
  recruitGeneral: Record<string, unknown>
  applicationInstitution: {
    overlay: Record<string, unknown>
    generalOverlay: Record<string, unknown>
    editorState: Record<string, unknown>
  }
  applicationVolunteer: {
    overlay: Record<string, unknown>
    editorState: Record<string, unknown>
  }
  /** 자동으로 채울 수 없어 관리자가 직접 입력해야 하는 항목 */
  manualInputRequired: string[]
}

type HalfProfile = {
  eventFrom: string
  eventTo: string
  preOffsetsDays: number[]
  closingOffsetsDays: number[]
  recruit: [string, string]
  docAnnounce: string
  interview: [string, string]
  finalAnnounce: string
  preDelivery: UjatEducationDelivery
  eventDelivery: UjatEducationDelivery
  closingDelivery: UjatEducationDelivery
  textbookMode: UjatTextbookEducationMode
  interviewMethod: '온라인' | '오프라인'
  activityTerm: string
  unavailable: 'none' | 'direct' | 'holiday' | 'holiday+direct'
  /** direct일 때 본교육 금요일 목록에서 제외할 순번(0부터) */
  unavailableFridayIndexes: number[]
  interviewExclusion: UnavailableDatesExclusionState
  capacity: (regionIndex: number) => { classCount: number; volunteerCount: number }
  contact: { name: string; phone: string; email: string }
  noticeExposure?: UjatVolunteerNoticeExposureValue
}

type CaseProfile = {
  serial: string
  businessFrom: string
  businessTo: string
  institutionRecruit: [string, string]
  institutionResultAnnounce: string
  halves: Record<UjatHalfSemesterKey, HalfProfile>
  surveyItems: ReturnType<typeof createUjatSurveyItemsDefault>
  kpi: { participantCount: number; volunteer: number; dispatchedSchool: number; dispatchedClass: number }
  educationCourse: string
  institutionTargets: string[]
  volunteerTargets: string[]
  application: 'basic' | 'max'
  volunteerApplicationType: 'new' | 'ujat-graduate'
}

const EXCLUDE_NONE: UnavailableDatesExclusionState = {
  excludeNone: true,
  excludeSaturday: false,
  excludeSunday: false,
  excludeHoliday: false,
}

const EXCLUDE_WEEKEND: UnavailableDatesExclusionState = {
  excludeNone: false,
  excludeSaturday: true,
  excludeSunday: true,
  excludeHoliday: false,
}

const INSTITUTION_CONTACT = {
  name: '김서연',
  phone: '02-512-3456',
  email: 'ujat.school@jakorea.org',
}

const H1_CONTACT = { name: '박지훈', phone: '010-6234-7890', email: 'ujat.h1@jakorea.org' }
const H2_CONTACT = { name: '이하은', phone: '010-5123-6789', email: 'ujat.h2@jakorea.org' }

function baseHalves(): Record<UjatHalfSemesterKey, HalfProfile> {
  return {
    h1: {
      eventFrom: '03-15',
      eventTo: '06-30',
      preOffsetsDays: [-10],
      closingOffsetsDays: [8],
      recruit: ['01-11', '01-29'],
      docAnnounce: '02-02',
      interview: ['02-05', '02-07'],
      finalAnnounce: '02-12',
      preDelivery: 'online',
      eventDelivery: 'offline',
      closingDelivery: 'online',
      textbookMode: 'ja',
      interviewMethod: '온라인',
      activityTerm: '1',
      unavailable: 'none',
      unavailableFridayIndexes: [],
      interviewExclusion: EXCLUDE_NONE,
      capacity: () => ({ classCount: 6, volunteerCount: 12 }),
      contact: H1_CONTACT,
    },
    h2: {
      eventFrom: '09-07',
      eventTo: '11-27',
      preOffsetsDays: [-10],
      closingOffsetsDays: [8],
      recruit: ['07-12', '07-30'],
      docAnnounce: '08-03',
      interview: ['08-06', '08-08'],
      finalAnnounce: '08-13',
      preDelivery: 'online',
      eventDelivery: 'offline',
      closingDelivery: 'online',
      textbookMode: 'ja',
      interviewMethod: '온라인',
      activityTerm: '2',
      unavailable: 'none',
      unavailableFridayIndexes: [],
      interviewExclusion: EXCLUDE_NONE,
      capacity: () => ({ classCount: 5, volunteerCount: 10 }),
      contact: H2_CONTACT,
      noticeExposure: 'start-day',
    },
  }
}

function baseProfile(serial: string): CaseProfile {
  return {
    serial,
    businessFrom: '03-01',
    businessTo: '12-31',
    institutionRecruit: ['01-04', '02-12'],
    institutionResultAnnounce: '02-19',
    halves: baseHalves(),
    surveyItems: createUjatSurveyItemsDefault(),
    kpi: { participantCount: 480, volunteer: 64, dispatchedSchool: 16, dispatchedClass: 32 },
    educationCourse: 'traditional_paper',
    institutionTargets: [EDUCATION_TARGET.elementary],
    volunteerTargets: [EDUCATION_TARGET.university],
    application: 'basic',
    volunteerApplicationType: 'ujat-graduate',
  }
}

function caseProfile(caseId: UjatDevAutofillCaseId): CaseProfile {
  const profile = baseProfile(caseId.replace('-', ''))
  switch (caseId) {
    case 'REG-01':
      return profile
    case 'REG-02': {
      const { h1, h2 } = profile.halves
      return {
        ...profile,
        halves: {
          h1: {
            ...h1,
            eventFrom: '04-01',
            eventTo: '06-19',
            preOffsetsDays: [-14, -7],
            closingOffsetsDays: [7],
            recruit: ['01-18', '02-06'],
            docAnnounce: '02-10',
            interview: ['02-12', '02-15'],
            finalAnnounce: '02-19',
            preDelivery: 'offline',
            capacity: index => ({ classCount: 4 + index, volunteerCount: 8 + index * 2 }),
          },
          h2: {
            ...h2,
            eventFrom: '09-14',
            eventTo: '11-20',
            preOffsetsDays: [-9],
            closingOffsetsDays: [10, 14],
            recruit: ['06-21', '07-09'],
            docAnnounce: '07-13',
            interview: ['07-15', '07-20'],
            finalAnnounce: '07-24',
            closingDelivery: 'offline',
            interviewMethod: '오프라인',
            unavailable: 'direct',
            unavailableFridayIndexes: [1],
            capacity: index => ({ classCount: 9 + index, volunteerCount: 15 + index }),
          },
        },
      }
    }
    case 'REG-03':
      return {
        ...profile,
        halves: {
          ...profile.halves,
          h2: { ...profile.halves.h2, noticeExposure: 'one-week-before' },
        },
      }
    case 'REG-04': {
      const { h1, h2 } = profile.halves
      return {
        ...profile,
        halves: {
          h1: {
            ...h1,
            unavailable: 'direct',
            unavailableFridayIndexes: [1, 3],
            interviewExclusion: EXCLUDE_WEEKEND,
          },
          h2: {
            ...h2,
            unavailable: 'holiday',
            interviewExclusion: { ...EXCLUDE_WEEKEND, excludeHoliday: true },
          },
        },
      }
    }
    case 'REG-05': {
      const { h1, h2 } = profile.halves
      return {
        ...profile,
        halves: {
          h1: { ...h1, textbookMode: 'ja', preDelivery: 'offline', eventDelivery: 'offline' },
          h2: {
            ...h2,
            textbookMode: 'instructor_outsource',
            preDelivery: 'online',
            eventDelivery: 'hybrid',
          },
        },
      }
    }
    case 'REG-06': {
      const { h1, h2 } = profile.halves
      return {
        ...profile,
        kpi: { participantCount: 960, volunteer: 128, dispatchedSchool: 32, dispatchedClass: 72 },
        educationCourse: 'blended_paper_computer',
        institutionTargets: [EDUCATION_TARGET.elementary, EDUCATION_TARGET.middle],
        volunteerTargets: [EDUCATION_TARGET.university, EDUCATION_TARGET.adult],
        application: 'max',
        volunteerApplicationType: 'new',
        halves: {
          h1: {
            ...h1,
            preOffsetsDays: [-12, -5],
            closingOffsetsDays: [6, 13],
            preDelivery: 'hybrid',
            textbookMode: 'ja',
            interviewMethod: '오프라인',
            unavailable: 'holiday+direct',
            unavailableFridayIndexes: [2],
            interviewExclusion: EXCLUDE_WEEKEND,
            capacity: index => ({ classCount: 3 + index * 2, volunteerCount: 6 + index * 3 }),
          },
          h2: {
            ...h2,
            preOffsetsDays: [-11, -4],
            closingOffsetsDays: [7, 12],
            eventDelivery: 'hybrid',
            closingDelivery: 'offline',
            textbookMode: 'instructor_outsource',
            unavailable: 'direct',
            unavailableFridayIndexes: [0, 4],
            interviewExclusion: { ...EXCLUDE_WEEKEND, excludeHoliday: true },
            noticeExposure: 'one-day-before',
            capacity: index => ({ classCount: 10 + index, volunteerCount: 20 + index * 2 }),
          },
        },
      }
    }
  }
}

function dateKey(year: number, monthDay: string): string {
  return `${year}-${monthDay}`
}

function toDay(key: string): Dayjs {
  return dayjs(key).startOf('day')
}

function keyOf(date: Dayjs): string {
  return date.format('YYYY-MM-DD')
}

/** 로컬 자정 ISO — 화면 date picker가 만드는 값과 같다 */
function iso(key: string): string {
  return toDay(key).toISOString()
}

function isoRange(range: UjatDevDateRange): { start: string; end: string } {
  return { start: iso(range.start), end: iso(range.end) }
}

function firstFridayOnOrAfter(key: string): string {
  let date = toDay(key)
  while (date.day() !== 5) date = date.add(1, 'day')
  return keyOf(date)
}

function lastFridayOnOrBefore(key: string): string {
  let date = toDay(key)
  while (date.day() !== 5) date = date.subtract(1, 'day')
  return keyOf(date)
}

export function listFridaysInRange(range: UjatDevDateRange): string[] {
  const out: string[] = []
  let cursor = toDay(firstFridayOnOrAfter(range.start))
  const end = toDay(range.end)
  while (!cursor.isAfter(end, 'day')) {
    out.push(keyOf(cursor))
    cursor = cursor.add(7, 'day')
  }
  return out
}

/** 불가일·공휴일을 뺀 뒤 학교가 신청할 수 있는 본교육 금요일 */
export function listAvailableEducationFridays(
  half: UjatDevHalfPlan,
  holidayDateKeys: ReadonlySet<string>
): string[] {
  const blocked = new Set(half.unavailableDates)
  return listFridaysInRange(half.event).filter(day => {
    if (half.exclusion.excludeNone) return true
    if (blocked.has(day)) return false
    if (half.exclusion.excludeHoliday && holidayDateKeys.has(day)) return false
    return true
  })
}

function buildHalfPlan(year: number, profile: HalfProfile): UjatDevHalfPlan {
  const event = {
    start: firstFridayOnOrAfter(dateKey(year, profile.eventFrom)),
    end: lastFridayOnOrBefore(dateKey(year, profile.eventTo)),
  }
  const eventStart = toDay(event.start)
  const eventEnd = toDay(event.end)
  const fridays = listFridaysInRange(event)
  const direct =
    profile.unavailable === 'direct' || profile.unavailable === 'holiday+direct'
      ? profile.unavailableFridayIndexes
          .map(index => fridays[index])
          .filter((day): day is string => day != null)
      : []
  const exclusion: UnavailableDatesExclusionState =
    profile.unavailable === 'none'
      ? { ...EXCLUDE_NONE }
      : {
          excludeNone: false,
          excludeSaturday: false,
          excludeSunday: false,
          excludeHoliday: profile.unavailable === 'holiday' || profile.unavailable === 'holiday+direct',
        }
  return {
    event,
    preDates: profile.preOffsetsDays.map(days => keyOf(eventStart.add(days, 'day'))),
    closingDates: profile.closingOffsetsDays.map(days => keyOf(eventEnd.add(days, 'day'))),
    recruit: {
      start: dateKey(year, profile.recruit[0]),
      end: dateKey(year, profile.recruit[1]),
    },
    docAnnounce: dateKey(year, profile.docAnnounce),
    interview: {
      start: dateKey(year, profile.interview[0]),
      end: dateKey(year, profile.interview[1]),
    },
    finalAnnounce: dateKey(year, profile.finalAnnounce),
    exclusion,
    unavailableDates: direct,
  }
}

export function buildUjatDevDatePlan(
  caseId: UjatDevAutofillCaseId,
  businessYear: number
): UjatDevDatePlan {
  const profile = caseProfile(caseId)
  return {
    business: {
      start: dateKey(businessYear, profile.businessFrom),
      end: dateKey(businessYear, profile.businessTo),
    },
    institution: {
      recruit: {
        start: dateKey(businessYear, profile.institutionRecruit[0]),
        end: dateKey(businessYear, profile.institutionRecruit[1]),
      },
      resultAnnounce: dateKey(businessYear, profile.institutionResultAnnounce),
    },
    halves: {
      h1: buildHalfPlan(businessYear, profile.halves.h1),
      h2: buildHalfPlan(businessYear, profile.halves.h2),
    },
  }
}

function scheduleBundle(
  dates: readonly string[],
  regions: readonly UjatDevAutofillRegion[],
  regionOffset: number
): UjatHalfMultiScheduleBundle {
  const rowIds = dates.map((_, index) => index)
  const regionByRow: Record<string, string[]> = {}
  const dateByRow: Record<string, string | null> = {}
  rowIds.forEach(id => {
    const region = regions[(regionOffset + id) % regions.length]
    regionByRow[String(id)] = region ? [region.key] : []
    dateByRow[String(id)] = iso(dates[id]!)
  })
  return { rowIds, regionByRow, dateByRow }
}

function regionCapacity(
  profile: CaseProfile,
  regions: readonly UjatDevAutofillRegion[]
): UjatRegionCapacityBySemesterState {
  const semester = (half: UjatHalfSemesterKey) =>
    Object.fromEntries(
      regions.map((region, index) => {
        const value = profile.halves[half].capacity(index)
        return [
          region.label,
          {
            classCount: String(value.classCount),
            volunteerCount: String(value.volunteerCount),
          },
        ]
      })
    )
  return { h1: semester('h1'), h2: semester('h2') }
}

function toSponsorOverlay(sponsor: ResolvedUjatDevDependencies['sponsor']): Record<string, unknown> {
  const sponsorId = sponsor.sponsorId.trim() || UJAT_SPONSOR_ALL_VALUE
  const contactId =
    sponsor.contactId.trim() || (sponsorId === UJAT_SPONSOR_ALL_VALUE ? UJAT_SPONSOR_ALL_VALUE : '')
  return {
    'ujat.basicInfo.sponsorId': sponsorId,
    'ujat.basicInfo.sponsorContactId': contactId,
    'ujat.basicInfo.sponsorContactIds': contactId ? [contactId] : [],
  }
}

function recruitCopy(title: string, label: string) {
  return {
    description: `${title}는 대학생 봉사단이 초등학교 금요일 수업에서 경제교육을 진행하는 프로그램입니다.`,
    recruitmentGuide: `${label} 신청서를 검토한 뒤 담당자가 개별 안내합니다.`,
    applicationMethod: `${label} 온라인 신청서를 작성해 제출해 주세요.`,
    learningSupportContent: '교재와 활동지를 제공하고, 수업 전 사전교육을 진행합니다.',
    otherNotes: '학교 일정에 따라 수업일이 조정될 수 있습니다.',
  }
}

function halfLabel(half: UjatHalfSemesterKey): string {
  return half === 'h1' ? '상반기' : '하반기'
}

function interviewClock(day: string, hour: number, minute = 0): Dayjs {
  return toDay(day).hour(hour).minute(minute).second(0).millisecond(0)
}

function buildApplicationInstitution(
  profile: CaseProfile,
  regions: readonly UjatDevAutofillRegion[]
): UjatDevAutofillFixture['applicationInstitution'] {
  const AK = UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS
  const blocks =
    profile.application === 'max'
      ? [
          { id: 'ujat-dev-grade-1', grade: '3', classNos: ['2', '4'], students: ['24', '26'] },
          { id: 'ujat-dev-grade-2', grade: '5', classNos: ['1'], students: ['27'] },
        ]
      : [{ id: 'ujat-dev-grade-1', grade: '1', classNos: ['1', '2'], students: ['25', '24'] }]
  const classTimeBlocks =
    profile.application === 'max'
      ? [
          { id: 'ujat-dev-class-time-1', periods: [1, 2] },
          { id: 'ujat-dev-class-time-2', periods: [3, 4] },
        ]
      : [{ id: 'ujat-dev-class-time-1', periods: [1] }]
  const periodClock: Record<number, [number, number, number, number]> = {
    1: [9, 0, 9, 40],
    2: [9, 50, 10, 30],
    3: [10, 40, 11, 20],
    4: [11, 30, 12, 10],
  }
  const anchor = dayjs('2000-01-07').startOf('day')
  const periodRange = (period: number) => {
    const [sh, sm, eh, em] = periodClock[period]!
    return {
      start: anchor.hour(sh).minute(sm).toISOString(),
      end: anchor.hour(eh).minute(em).toISOString(),
    }
  }
  const overlay: Record<string, unknown> = {
    [AK.applicationRegion]: regions[0]!.label,
    [AK.gradeDetailByBlock]: Object.fromEntries(
      blocks.map(block => [
        block.id,
        {
          classCountInput: String(block.classNos.length),
          classNoByIndex: Object.fromEntries(block.classNos.map((no, index) => [index, no])),
          studentCountByIndex: Object.fromEntries(block.students.map((count, index) => [index, count])),
        },
      ])
    ),
    [AK.classTimeCheckedByBlock]: Object.fromEntries(
      classTimeBlocks.map(block => [
        block.id,
        Object.fromEntries(block.periods.map(period => [String(period), true])),
      ])
    ),
    [AK.classTimePeriodsByBlock]: Object.fromEntries(
      classTimeBlocks.map(block => [
        block.id,
        Object.fromEntries(
          [1, 2, 3, 4].map(period => [
            `period${period}`,
            block.periods.includes(period) ? periodRange(period) : { start: null, end: null },
          ])
        ),
      ])
    ),
  }
  const generalOverlay = {
    'application.ujat.inst.basicInfo.detailAddress': '서울시 강남구 테헤란로 123',
    'application.ujat.inst.basicInfo.teacherTel': '02-1234-5678',
    'application.ujat.inst.basicInfo.teacherMobile': '010-1234-5678',
    'application.ujat.inst.basicInfo.teacherEmail': 'dev@jakorea.org',
    'application.ujat.inst.basicInfo.otherRequestsNotApplicable': false,
    'application.ujat.inst.basicInfo.otherRequests': '교구재 배송 전 담당자에게 연락해 주세요.',
  }
  return {
    overlay,
    generalOverlay,
    editorState: {
      ujatGradeApplicationBlockIds: blocks.map(block => block.id),
      ujatApplicationGradeByBlockId: Object.fromEntries(blocks.map(block => [block.id, block.grade])),
      ujatGradeClassTimeBlockIds: classTimeBlocks.map(block => block.id),
    },
  }
}

function buildApplicationVolunteer(
  profile: CaseProfile,
  regions: readonly UjatDevAutofillRegion[],
  businessYear: number
): UjatDevAutofillFixture['applicationVolunteer'] {
  const AK = UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS
  const graduate = profile.volunteerApplicationType === 'ujat-graduate'
  return {
    overlay: {
      [AK.preferredRegion]: regions[profile.application === 'max' ? regions.length - 1 : 0]!.label,
      [AK.universityName]: '한국대학교',
      [AK.grade]: graduate ? '4' : '2',
      [AK.major]: graduate ? '경영학과' : '경제학과',
      [AK.applicationRoute]: 'instagram',
      [AK.applicationRouteOther]: '',
      [AK.id1365]: 'dev1365',
      [AK.previousTerm]: graduate ? '1' : '',
      [AK.previousYear]: graduate ? String(businessYear - 1) : '',
      [AK.previousTermFileNames]: [],
      [AK.hasExperience]: graduate ? 'yes' : 'no',
    },
    editorState: { ujatVolunteerApplicationType: profile.volunteerApplicationType },
  }
}

/**
 * 케이스·연도·참조 데이터가 같으면 항상 같은 Fixture를 만든다 (Math.random 없음).
 * 상태 store에는 쓰지 않는다.
 */
export function buildUjatDevAutofillFixture(
  options: { caseId: UjatDevAutofillCaseId; businessYear: number },
  dependencies: ResolvedUjatDevDependencies
): UjatDevAutofillFixture {
  const { caseId, businessYear } = options
  const profile = caseProfile(caseId)
  const plan = buildUjatDevDatePlan(caseId, businessYear)
  const regions = dependencies.regions
  if (regions.length === 0) {
    throw new Error('사용 중인 UJAT 교육 지역이 없습니다. 교육 지역 관리에서 지역을 먼저 활성화해 주세요.')
  }
  const manualInputRequired: string[] = []
  const title = `DEV-UJAT-${profile.serial}-${businessYear}-샘플01`
  const businessIso = isoRange(plan.business)

  const halfSchedule: Record<string, unknown> = {}
  for (const half of HALVES) {
    const halfProfile = profile.halves[half]
    const halfPlan = plan.halves[half]
    const keys = ujatHalfScheduleOverlayKeys(half)
    const settingsKeys = ujatEducationScheduleSettingsOverlayKeys(half)
    const regionOffset = half === 'h1' ? 0 : 1
    Object.assign(halfSchedule, {
      [keys.preName]: `${halfLabel(half)} 사전교육(발대식)`,
      [keys.preDelivery]: halfProfile.preDelivery,
      [keys.preTextbookMode]: halfProfile.textbookMode,
      [keys.preMulti]: scheduleBundle(halfPlan.preDates, regions, regionOffset),
      [keys.eventName]: `${halfLabel(half)} 학교 경제교육`,
      [keys.eventRange]: isoRange(halfPlan.event),
      [keys.eventDelivery]: halfProfile.eventDelivery,
      [keys.closingName]: `${halfLabel(half)} 해단식`,
      [keys.closingDelivery]: halfProfile.closingDelivery,
      [keys.closingMulti]: scheduleBundle(halfPlan.closingDates, regions, regionOffset + 2),
      [settingsKeys.exclusion]: { ...halfPlan.exclusion },
      [settingsKeys.unavailableDates]: [...halfPlan.unavailableDates],
    })
    if (halfProfile.textbookMode === 'instructor_outsource') {
      if (dependencies.instructorId) {
        halfSchedule[keys.preTextbookInstructorId] = dependencies.instructorId
      } else {
        manualInputRequired.push(`${half}.pre.textbookInstructorId`)
      }
    }
  }

  if (dependencies.paymentItemValues.length === 0) {
    manualInputRequired.push('wage.paymentItemValues')
  }

  const institutionCopy = recruitCopy(title, '참여 학교')
  const recruitInstitution: Record<string, unknown> = {
    [IK.announcementPublished]: true,
    [IK.publicTitle]: `${title} 참여 학교 모집`,
    [IK.programRange]: businessIso,
    [IK.targetLevels]: [...profile.institutionTargets],
    [IK.district]: profile.institutionTargets.length > 1 ? '초등학교 5~6학년, 중학교 1학년' : '초등학교 4~6학년',
    [IK.recruitRange]: isoRange(plan.institution.recruit),
    [IK.resultAnnounce]: { date: iso(plan.institution.resultAnnounce), method: '이메일 안내' },
    [IK.contact]: { ...INSTITUTION_CONTACT },
    [IK.notes]: '학교당 1회만 신청할 수 있습니다.',
    [IK.description]: institutionCopy.description,
    [IK.recruitmentGuide]: institutionCopy.recruitmentGuide,
    [IK.applicationMethod]: institutionCopy.applicationMethod,
    [IK.learningSupportContent]: institutionCopy.learningSupportContent,
    [IK.additionalContentHtml]: `<p>${title} 참여를 희망하는 학교는 모집 기간 안에 신청해 주세요.</p>`,
    [IK.attachmentFileNames]: [],
  }

  const recruitVolunteer: Record<string, unknown> = {}
  const recruitGeneral: Record<string, unknown> = {
    'ujatRecruit.detailInfo.thumbFileName': null,
    'ujatRecruit.detailInfo.attachmentFileNames': [],
    'ujatRecruit.detailInfo.attachmentFileObjectIds': [],
    'ujatRecruit.detailInfo.programDescription': institutionCopy.description,
    'ujatRecruit.detailInfo.recruitmentGuide': institutionCopy.recruitmentGuide,
    'ujatRecruit.detailInfo.applicationMethod': institutionCopy.applicationMethod,
    'ujatRecruit.detailInfo.learningSupportContent': institutionCopy.learningSupportContent,
    'ujatRecruit.detailInfo.additionalContentHtml': recruitInstitution[IK.additionalContentHtml],
  }
  for (const half of HALVES) {
    const halfProfile = profile.halves[half]
    const halfPlan = plan.halves[half]
    const label = `${halfLabel(half)} 봉사자`
    const copy = recruitCopy(title, label)
    const k = (field: Parameters<typeof ujatVolunteerHalfOverlayKey>[1]) =>
      ujatVolunteerHalfOverlayKey(half, field)
    Object.assign(recruitVolunteer, {
      [k('announcementPublished')]: true,
      ...(half === 'h2' && halfProfile.noticeExposure
        ? { [k('noticeExposure')]: halfProfile.noticeExposure }
        : {}),
      [k('publicTitle')]: `${title} ${label} 모집`,
      [k('programRange')]: businessIso,
      [k('volunteerTargets')]: [...profile.volunteerTargets],
      [k('targetDetail')]:
        profile.volunteerTargets.length > 1 ? '경제·교육 관련 학과 재학생, 평일 참여 가능한 성인' : '경제·교육 관련 학과 재학생',
      [k('docAnnounce')]: { date: iso(halfPlan.docAnnounce), method: '문자 안내' },
      [k('interviewRange')]: isoRange(halfPlan.interview),
      [k('interviewMethod')]: halfProfile.interviewMethod,
      [k('finalAnnounce')]: { date: iso(halfPlan.finalAnnounce), method: '이메일 안내' },
      [k('contact')]: { ...halfProfile.contact },
      [k('notes')]: `${label} 모집 유의사항을 확인해 주세요.`,
      [k('otherNotes')]: copy.otherNotes,
      [k('description')]: copy.description,
      [k('recruitmentGuide')]: copy.recruitmentGuide,
      [k('applicationMethod')]: copy.applicationMethod,
      [k('additionalContentHtml')]: `<p>${title} ${label} 모집 관련 안내입니다.</p>`,
      [k('attachmentFileNames')]: [],
      [half === 'h1' ? VK.recruitRangeH1 : VK.recruitRangeH2]: isoRange(halfPlan.recruit),
      [half === 'h1' ? VK.activityTermH1 : VK.activityTermH2]: halfProfile.activityTerm,
    })

    const ns = ujatVolunteerRecruitInterviewNamespace(half)
    const detail = ujatVolunteerRecruitDetailInfoPrefix(half)
    const clockStart = interviewClock(halfPlan.interview.start, 10)
    const clockEnd = interviewClock(halfPlan.interview.start, 12)
    const firstSlotEnd = clockStart.add(30, 'minute')
    Object.assign(recruitGeneral, {
      [ujatVolunteerRecruitInterviewRangeSealKey(half)]: isoRange(halfPlan.interview),
      [`${ns}.timeUnit`]: '30',
      [`${ns}.interviewTimeRange`]: [clockStart.toISOString(), clockEnd.toISOString()],
      [`${ns}.interviewTime`]: clockStart.toISOString(),
      [`${ns}.selectedSlotKeys`]: [`${clockStart.valueOf()}-${firstSlotEnd.valueOf()}`],
      [`${ns}.exclusionState`]: { ...halfProfile.interviewExclusion },
      [`${ns}.appliedUnavailableDates`]: [],
      [`${detail}.programDescription`]: copy.description,
      [`${detail}.recruitmentGuide`]: copy.recruitmentGuide,
      [`${detail}.applicationMethod`]: copy.applicationMethod,
      [`${detail}.otherNotes`]: copy.otherNotes,
      [`${detail}.additionalContentHtml`]: recruitVolunteer[k('additionalContentHtml')],
    })
  }

  const registration: Record<string, unknown> = {
    'ujat.basicInfo.repKo': UJAT_BASIC_INFO_REP_KO_DEFAULT,
    'ujat.basicInfo.repEn': UJAT_BASIC_INFO_REP_EN_DEFAULT,
    'ujat.basicInfo.programManagementName': title,
    'ujat.basicInfo.detailedProgramId': UJAT_DETAILED_PROGRAM_UJAT_VALUE,
    'ujat.basicInfo.detailedProgramName': UJAT_DETAILED_PROGRAM_UJAT_LABEL,
    'ujat.basicInfo.operationRangeSeal': businessIso,
    'ujat.basicInfo.operationAnchorIso': businessIso.start,
    'ujat.basicInfo.businessField': 'economy_finance',
    'ujat.basicInfo.educationCourse': profile.educationCourse,
    'ujat.basicInfo.ipOwned': 'ja',
    'ujat.basicInfo.courseDeliveredBy': 'ja',
    'ujat.basicInfo.ipsCategory': 'prepare',
    'ujat.basicInfo.partnerInvolvement': 'no',
    ...toSponsorOverlay(dependencies.sponsor),
    'ujat.basicInfo.participant.individual': false,
    'ujat.basicInfo.participant.organization': true,
    'ujat.basicInfo.participant.teacher': false,
    'ujat.basicInfo.participant.volunteer': true,
    'ujat.basicInfo.surveyItems': { ...profile.surveyItems },
    'ujat.kpi.participantCount': profile.kpi.participantCount,
    'ujat.kpi.volunteer': profile.kpi.volunteer,
    'ujat.kpi.dispatchedSchool': profile.kpi.dispatchedSchool,
    'ujat.kpi.dispatchedClass': profile.kpi.dispatchedClass,
    [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: [...dependencies.paymentItemValues],
    [UJAT_REGION_CAPACITY_OVERLAY_KEY]: regionCapacity(profile, regions),
    ...halfSchedule,
    ...recruitInstitution,
    ...recruitVolunteer,
  }

  return {
    caseId,
    businessYear,
    plan,
    registration,
    recruitInstitution,
    recruitVolunteer,
    recruitGeneral,
    applicationInstitution: buildApplicationInstitution(profile, regions),
    applicationVolunteer: buildApplicationVolunteer(profile, regions, businessYear),
    manualInputRequired,
  }
}
