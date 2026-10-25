import dayjs, { type Dayjs } from 'dayjs'
import {
  buildEconomyAutofillDatePlan,
  selectEconomyRegistrationAutofillPhrases,
  type EconomyAutofillPhraseSelection,
} from '@/features/program/1c-1s/lib/dev-autofill-phrases'
import {
  fillBlankApplicationFormThirdPartyRecipients,
  seedDevAutofillApplicationThirdPartyRecipients,
} from '@/features/program/general/lib/fill-application-form-third-party-recipient'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { publishRegistrationWizardApplicationDraft } from '@/features/program/general/lib/registration-wizard-session-drafts'
import {
  mergeGeneralDevAutofillParticipant,
  resolveGeneralRegistrationDevAutofillPreset,
  type GeneralRegistrationDevAutofillCaseId,
  type GeneralRegistrationDevAutofillOverlayBehavior,
} from '@/features/program/general/lib/registration-dev-autofill-cases'
import {
  resolveTrainedTeachersRegistrationDevAutofillPreset,
  type TrainedTeachersRegistrationDevAutofillCaseId,
} from '@/features/program/trained-teachers/lib/registration-dev-autofill-cases'
import type { GeneralProgramRegistrationParticipantFlags } from '@/features/program/general/model/registration-flow'
import { isDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import { shouldDisableEducationSchedulePeriodMode } from '@/features/program/general/lib/schedule-detail-form'
import { completeTrainedTeachersDevAutofillOverlay } from '@/features/program/trained-teachers/lib/dev-autofill-required'
import type { TrainedTeachersRegistrationRequiredFieldContext } from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { applyDevAutofillRecruitOverlayPartials } from '@/features/program/shared/lib/dev-autofill-recruit-overlay'
import { getDetailedProgramOptionsList } from '@/features/detailed-program/api/admin-detailed-programs-service'
import {
  getSponsorContacts,
  getSponsorOptionsList,
  shouldUseSponsorsRemoteApi,
} from '@/features/sponsor/api/admin-sponsors-service'
import {
  UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_OPTION,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import {
  ensurePaymentItemCatalog,
  getActivePaymentItemCatalogOptions,
} from '@/features/template/lib/template-registration-payment-item-options'
import { PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  patchGeneralRegistrationSponsorSelectionOverlay,
  patchProgramRegistrationOverlay,
  replaceProgramRegistrationOverlayPrefixes,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import {
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  ujatHalfScheduleOverlayKeys,
  type UjatEducationDelivery,
  type UjatHalfMultiScheduleBundle,
  type UjatHalfSemesterKey,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { ujatEducationScheduleSettingsOverlayKeys } from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { getPublicHolidayDateKeysForSchedule } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import {
  pickUjatRecruitInstitutionOverlay,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  pickUjatRecruitVolunteerOverlay,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  resolveUjatDefaultPaymentItemValues,
  UJAT_WAGE_OVERLAY_PAYMENT_KEY,
} from '@/features/program/ujat/lib/ujat-wage-info-display'
import { stripUjatKpiWageCapacityOverlay } from '@/features/program/ujat/lib/ujat-kpi-wage-capacity-typed'
import {
  ujatVolunteerHalfOverlayKey,
  ujatVolunteerRecruitDetailInfoPrefix,
  ujatVolunteerRecruitInterviewNamespace,
  ujatVolunteerRecruitInterviewRangeSealKey,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { UJAT_VOLUNTEER_NOTICE_EXPOSURE_VALUES } from '@/features/template/lib/ujat-volunteer-notice-exposure'
import {
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
  type UjatRegionCapacityBySemesterState,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { encodeSponsorManagerContactRef } from '@/features/program/general/model/common-info-edit-schema'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import {
  INSTRUCTOR_TARGET_OPTIONS,
  INTERVIEW_METHOD_OPTIONS,
  VOLUNTEER_TARGET_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { createDefaultUnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { replaceGeneralApplicationOverlayForScope } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
  replaceUjatApplicationInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  replaceUjatApplicationVolunteerOverlayForScope,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'

const VENUE_KINDS = ['inside', 'outside', 'other'] as const
const EDUCATION_DELIVERIES = [
  'online',
  'offline',
  'hybrid',
] as const satisfies readonly UjatEducationDelivery[]

const PROGRAM_SAMPLES = [
  {
    titleKo: '청소년 경제금융 탐험',
    titleEn: 'Youth Economics and Finance Exploration',
    publicTitle: '2026 청소년 경제금융 교육 참여자 모집',
  },
  {
    titleKo: '중학생 진로 설계 워크숍',
    titleEn: 'Middle School Career Design Workshop',
    publicTitle: '중학생 진로·직업 탐색 프로그램 모집',
  },
  {
    titleKo: '디지털 리터러시 교실',
    titleEn: 'Digital Literacy Classroom',
    publicTitle: '초등 고학년 디지털 리터러시 교육 신청',
  },
  {
    titleKo: '기업가정신 스타트업 체험',
    titleEn: 'Entrepreneurship Startup Experience',
    publicTitle: '고등학생 기업가정신 캠프 참가자 모집',
  },
  {
    titleKo: '우리 동네 소비와 저축',
    titleEn: 'Local Spending and Saving',
    publicTitle: '초등 경제교육 학급 신청 안내',
  },
] as const

const UNIT_SAMPLES = [
  {
    name: '필요와 욕구, 현명한 소비',
    content: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
  },
  {
    name: '저축 목표 세우기',
    content: '용돈 사용 내역을 보고 한 달 저축 목표와 방법을 정합니다.',
  },
  {
    name: '직업 세계 탐색',
    content: '관심 직업의 역할과 필요한 역량을 사례로 알아봅니다.',
  },
  {
    name: '팀 프로젝트 기획',
    content: '모둠별로 문제 상황을 정하고 해결 아이디어를 발표합니다.',
  },
  {
    name: '온라인 정보의 신뢰',
    content: '검색 결과의 출처를 확인하고 안전한 정보 이용 습관을 익힙니다.',
  },
] as const

const VENUE_DETAILS: Record<(typeof VENUE_KINDS)[number], readonly string[]> = {
  inside: ['본관 2층 대강의실', '학교 도서관 세미나실', '시청각실'],
  outside: ['인근 구립도서관 강의실', '지역 청소년수련관 다목적홀'],
  other: ['온라인 화상 강의(Zoom)', '혼합 수업(교실 + 화상)'],
}

const TIME_SLOTS = [
  { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  { startHour: 13, startMinute: 30, endHour: 16, endMinute: 0 },
  { startHour: 9, startMinute: 30, endHour: 11, endMinute: 30 },
  { startHour: 14, startMinute: 0, endHour: 16, endMinute: 30 },
] as const

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function pickInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function pickOptionValue(options: readonly { readonly value: string }[], fallback = ''): string {
  if (options.length === 0) return fallback
  return pick(options).value
}

function upcomingWeekday(daysAhead: number): Dayjs {
  let date = dayjs().add(daysAhead, 'day').startOf('day')
  while (date.day() === 0 || date.day() === 6) date = date.add(1, 'day')
  return date
}

function atClock(date: Dayjs, hour: number, minute: number): Dayjs {
  return date.hour(hour).minute(minute).second(0).millisecond(0)
}

type DevAutofillSample = {
  titleKo: string
  titleEn: string
  publicTitle: string
  operationRange: { start: string; end: string }
  recruitDates: ReturnType<typeof buildRegistrationDatePlan>
  scheduleLines: string[]
  periodRange: { start: string; end: string }
  venueKind: (typeof VENUE_KINDS)[number]
  venueDetail: string
  businessField: string
  educationCourse: string
  ipOwned: string
  courseDeliveredBy: string
  partnerInvolvement: 'yes' | 'no'
  ipsCategory: 'inspire' | 'prepare' | 'succeed'
  ipsDetail: string
  units: Array<{ name: string; content: string }>
  kpi: {
    participant: number
    instructor: number
    volunteer: number
    school: number
    classCount: number
  }
  wages: {
    grade1: number
    grade2: number
    grade3: number
    grade1Distance: number
    grade2Distance: number
    grade3Distance: number
  }
  survey: { survey: boolean; satisfaction: boolean; lecture_evaluation: boolean }
  eventNames: [string, string]
}

type RangeIso = { start: string; end: string }

function dayIso(date: Dayjs): string {
  return date.startOf('day').toISOString()
}

function clampDayjs(date: Dayjs, lo: Dayjs, hi: Dayjs): Dayjs {
  if (date.isBefore(lo, 'day')) return lo
  if (date.isAfter(hi, 'day')) return hi
  return date
}

/** 사업 기간을 상·하반기로 나눈다. 두 구간 모두 bounds 안. */
export function ujatAutofillHalfRanges(
  range: RangeIso
): Record<UjatHalfSemesterKey, { start: Dayjs; end: Dayjs }> {
  const start = dayjs(range.start).startOf('day')
  const end = dayjs(range.end).startOf('day')
  const lo = start.isAfter(end, 'day') ? end : start
  const hi = start.isAfter(end, 'day') ? start : end
  const span = Math.max(0, hi.diff(lo, 'day'))
  if (span <= 1) {
    return {
      h1: { start: lo, end: lo },
      h2: { start: hi, end: hi },
    }
  }
  const mid = lo.add(Math.floor(span / 2), 'day')
  return {
    h1: { start: lo, end: mid },
    h2: { start: mid.add(1, 'day'), end: hi },
  }
}

/**
 * UJAT 자동입력 날짜 SSOT.
 * 프로그램·교육 일정 ⊆ 사업 기간. 모집·면접은 사업 시작 전~안으로만.
 */
export function alignUjatAutofillDatePlan(
  plan: ReturnType<typeof buildRegistrationDatePlan>
): ReturnType<typeof buildRegistrationDatePlan> {
  const bizStart = dayjs(plan.business.start).startOf('day')
  const bizEnd = dayjs(plan.business.end).startOf('day')
  const lo = bizStart.isAfter(bizEnd, 'day') ? bizEnd : bizStart
  const hi = bizStart.isAfter(bizEnd, 'day') ? bizStart : bizEnd

  const program = { start: dayIso(lo), end: dayIso(hi) }

  const recruitLead = pickInt(3, 14)
  const recruitStart = lo.subtract(recruitLead, 'day')
  const recruitEnd = lo.subtract(1, 'day')
  const recruit = recruitEnd.isBefore(recruitStart, 'day')
    ? { start: dayIso(recruitStart), end: dayIso(recruitStart) }
    : { start: dayIso(recruitStart), end: dayIso(recruitEnd) }

  const rStart = dayjs(recruit.start)
  const rEnd = dayjs(recruit.end)
  const recruitDays = Math.max(0, rEnd.diff(rStart, 'day'))
  const interviewStart = rStart.add(recruitDays <= 1 ? 0 : pickInt(0, recruitDays - 1), 'day')
  const remain = Math.max(0, rEnd.diff(interviewStart, 'day'))
  const interviewEnd = interviewStart.add(remain === 0 ? 0 : pickInt(0, remain), 'day')

  return {
    business: { start: dayIso(lo), end: dayIso(hi) },
    program,
    recruit,
    interview: {
      start: dayIso(clampDayjs(interviewStart, rStart, rEnd)),
      end: dayIso(clampDayjs(interviewEnd, rStart, rEnd)),
    },
  }
}

/** 사업 운영(10~12월) → 프로그램 운영(±1주) → 모집(시작일부터 최대 2주) → 면접(모집 기간 안) */
function buildRegistrationDatePlan(year = dayjs().year()): {
  business: RangeIso
  program: RangeIso
  recruit: RangeIso
  interview: RangeIso
} {
  const windowStart = dayjs(`${year}-10-01`).startOf('day')
  const windowEnd = dayjs(`${year}-12-31`).startOf('day')
  const latestBizStart = dayjs(`${year}-11-30`).startOf('day')
  const bizStart = windowStart.add(pickInt(0, latestBizStart.diff(windowStart, 'day')), 'day')
  const earliestBizEnd = bizStart.add(21, 'day')
  const bizEndFloor = earliestBizEnd.isAfter(windowEnd) ? windowEnd : earliestBizEnd
  const bizEnd = bizEndFloor.add(pickInt(0, Math.max(0, windowEnd.diff(bizEndFloor, 'day'))), 'day')

  const programStart = bizStart.add(pickInt(-7, 7), 'day')
  let programEnd = bizEnd.add(pickInt(-7, 7), 'day')
  if (!programEnd.isAfter(programStart, 'day')) programEnd = programStart.add(7, 'day')

  const recruitStart = programStart
  const recruitEnd = recruitStart.add(pickInt(3, 14), 'day')

  const recruitDays = Math.max(0, recruitEnd.diff(recruitStart, 'day'))
  const interviewStart = recruitStart.add(recruitDays <= 1 ? 0 : pickInt(0, recruitDays - 1), 'day')
  const interviewRemain = Math.max(0, recruitEnd.diff(interviewStart, 'day'))
  const interviewEnd = interviewStart.add(
    interviewRemain === 0 ? 0 : pickInt(0, interviewRemain),
    'day'
  )

  return {
    business: { start: dayIso(bizStart), end: dayIso(bizEnd) },
    program: { start: dayIso(programStart), end: dayIso(programEnd) },
    recruit: { start: dayIso(recruitStart), end: dayIso(recruitEnd) },
    interview: { start: dayIso(interviewStart), end: dayIso(interviewEnd) },
  }
}

const RECRUIT_CONTACTS = ['김서연', '박지훈', '이하은', '정민재', '최수아'] as const
const RECRUIT_PHONES = ['010-5123-6789', '010-6234-7890', '02-512-3456', '031-234-5678'] as const
const RECRUIT_EMAILS = [
  'edu.team@jakorea.org',
  'school.partner@jakorea.org',
  'recruit@jakorea.org',
  'program.desk@jakorea.org',
] as const
const RECRUIT_ANNOUNCE_METHODS = ['홈페이지 공지', '문자 안내', '이메일 안내'] as const
const RECRUIT_NOTES = [
  '신청 전 학교 담당 교사 확인이 필요합니다.',
  '모집 인원 초과 시 선착순으로 마감합니다.',
  '일정은 학교 사정에 따라 조율할 수 있습니다.',
] as const
const EDUCATION_TARGET_DETAIL: Record<string, string> = {
  elementary: '초등학교 4~6학년',
  middle: '중학교 1~3학년',
  high: '고등학교 1~2학년',
  university: '대학교 1~2학년',
  adult: '성인 일반',
}
const INSTRUCTOR_TARGET_DETAIL: Record<string, string> = {
  adult: '경제 교육 경력 강사',
  university: '관련 학과 재학생',
  elementary: '초등 대상 강의 경험',
  middle: '중등 대상 강의 경험',
  high: '고등 대상 강의 경험',
}
const VOLUNTEER_TARGET_DETAIL: Record<string, string> = {
  elementary: '초등학교 4~6학년',
  middle: '중학교 1~3학년',
  high: '고등학교 1~2학년',
  university: '경제·교육 관련 학과 재학생',
  adult: '평일 오후 참여 가능한 성인',
}

function pickSome<T>(items: readonly T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(count, items.length))
}

function recruitInquiryPatch(prefix: string): Record<string, unknown> {
  return {
    [`${prefix}.inquiryContact`]: pick(RECRUIT_CONTACTS),
    [`${prefix}.inquiryTel`]: pick(RECRUIT_PHONES),
    [`${prefix}.inquiryEmail`]: pick(RECRUIT_EMAILS),
    [`${prefix}.notesNotApplicable`]: false,
    [`${prefix}.notes`]: pick(RECRUIT_NOTES),
    [`${prefix}.finalAnnounceMethod`]: pick(RECRUIT_ANNOUNCE_METHODS),
  }
}

function recruitDetailPatch(
  prefix: string,
  fields: readonly string[],
  titleKo: string,
  copyOverride?: EconomyAutofillPhraseSelection['recruit']
): Record<string, unknown> {
  const copy: Record<string, string> = {
    programDescription: `${titleKo}는 학교 현장에서 경제·금융 기초를 익히는 참여형 교육입니다.`,
    recruitmentGuide: '신청서 제출 후 담당자 확인을 거쳐 참여 학교를 확정합니다.',
    applicationMethod: '온라인 신청서 작성 후 제출해 주세요. 추가 서류는 담당자가 안내합니다.',
    learningSupportContent: '교재와 활동지를 제공하고, 수업 전 강사 사전 연수를 진행합니다.',
    otherNotes: '우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.',
    ...(copyOverride
      ? {
          programDescription: copyOverride.programDescription,
          recruitmentGuide: copyOverride.recruitmentGuide,
          applicationMethod: copyOverride.applicationMethod,
          learningSupportContent: copyOverride.learningSupportContent,
          otherNotes: copyOverride.otherNotes,
        }
      : {}),
  }
  const patch: Record<string, unknown> = {
    [`${prefix}.thumbFileName`]: null,
    // DEV 자동입력은 실제 파일을 업로드하지 않으므로 이전 실행의 첨부
    // 메타데이터가 남아 입력 누락처럼 보이지 않도록 빈 상태를 명시한다.
    [`${prefix}.attachmentFileNames`]: [],
    [`${prefix}.attachmentFileObjectIds`]: [],
    [`${prefix}.additionalContentHtml`]:
      copyOverride?.additionalContentHtml ??
      `<p>${titleKo} 참여를 희망하는 학교와 강사는 모집 기간 안에 신청해 주세요.</p>`,
  }
  for (const field of fields) {
    patch[`${prefix}.${field}`] = copy[field] ?? ''
  }
  return patch
}

function patchRecruitDatePlan(
  plan: ReturnType<typeof buildRegistrationDatePlan>,
  titleKo: string,
  args: {
    variant: ProgramRegistrationFormVariant | 'ujat'
    participant?: ProgramRegistrationDevAutofillLayout['participant']
    economy?: EconomyAutofillPhraseSelection
  }
): void {
  if (args.variant === 'ujat') return
  const economy = args.economy
  const programSeal = { ...plan.program }
  const recruitSeal = { ...plan.recruit }
  const interviewSeal = { ...plan.interview }
  const institutionKeys = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  const educationTargets = economy
    ? economy.targetLevels.map(value => ({
        value,
        label: value,
      }))
    : pickSome(EDUCATION_TARGET_OPTIONS, pickInt(1, 2))
  const instructorTargets = pickSome(INSTRUCTOR_TARGET_OPTIONS, pickInt(1, 2))
  const volunteerTargets = pickSome(VOLUNTEER_TARGET_OPTIONS, pickInt(1, 2))
  const educationTargetDetail =
    economy?.targetLevelDetail ??
    educationTargets.map(option => EDUCATION_TARGET_DETAIL[option.value] ?? option.label).join(', ')
  const economyRecruit = economy?.recruit
  const interviewClockStart = dayjs().startOf('day').hour(10).minute(0).second(0).millisecond(0)
  const interviewClockEnd = interviewClockStart.hour(12)
  const firstSlotEnd = interviewClockStart.add(30, 'minute')
  const institutionInquiry = recruitInquiryPatch('recruit')

  const institutionPartial = {
    [institutionKeys.announcementPublished]: 'published',
    [institutionKeys.studentListRequired]: economy ? 'none' : pick(['need', 'none']),
    [institutionKeys.preguidanceRequired]: economy ? 'need' : pick(['need', 'none']),
    [institutionKeys.maxAssignableInstructors]: pickInt(1, 4),
    [institutionKeys.maxClassCount]: pickInt(2, 6),
    [institutionKeys.maxScheduleCount]: economy ? 2 : pickInt(1, 4),
    [institutionKeys.maxSessionsPerDay]: economy ? 2 : pickInt(2, 6),
    [institutionKeys.programRangeSeal]: programSeal,
    [institutionKeys.programAnchorIso]: programSeal.start,
    [institutionKeys.recruitRangeSeal]: recruitSeal,
    [institutionKeys.recruitAnchorIso]: recruitSeal.start,
    [institutionKeys.targetLevels]: educationTargets.map(option => option.value),
    [institutionKeys.targetLevelDetail]: educationTargetDetail,
    [institutionKeys.finalAnnounceIso]: recruitSeal.end,
    [institutionKeys.finalAnnounceMethod]: institutionInquiry['recruit.finalAnnounceMethod'],
    [institutionKeys.inquiryContact]: institutionInquiry['recruit.inquiryContact'],
    [institutionKeys.inquiryTel]: institutionInquiry['recruit.inquiryTel'],
    [institutionKeys.inquiryEmail]: institutionInquiry['recruit.inquiryEmail'],
    [institutionKeys.notesNotApplicable]: false,
    [institutionKeys.notes]: economyRecruit?.notes ?? institutionInquiry['recruit.notes'],
  }

  const individualInquiry = recruitInquiryPatch('recruit.individual')
  const instructorInquiry = recruitInquiryPatch('recruit.instructor')
  const volunteerInquiry = recruitInquiryPatch('recruit.volunteer')
  const generalPartial = {
    ...individualInquiry,
    ...instructorInquiry,
    ...volunteerInquiry,
    'recruit.individual.announcementPublished': 'published',
    'recruit.individual.programRangeSeal': programSeal,
    'recruit.individual.programAnchorIso': programSeal.start,
    'recruit.individual.recruitRangeSeal': recruitSeal,
    'recruit.individual.recruitAnchorIso': recruitSeal.start,
    'recruit.individual.finalAnnounceIso': recruitSeal.end,
    'recruit.individual.targetLevels': educationTargets.map(option => option.value),
    'recruit.individual.targetLevelDetail': educationTargetDetail,
    'recruit.individual.docDeadlineIso': recruitSeal.start,
    'recruit.individual.docAnnounceMethod': pick(RECRUIT_ANNOUNCE_METHODS),
    'recruit.individual.interviewRangeSeal': interviewSeal,
    'recruit.individual.interviewAnchorIso': interviewSeal.start,
    'recruit.individual.interviewMethod': pick(INTERVIEW_METHOD_OPTIONS).value,
    'recruit.instructor.announcementPublished': 'published',
    'recruit.instructor.programRangeSeal': programSeal,
    'recruit.instructor.programAnchorIso': programSeal.start,
    'recruit.instructor.recruitRangeSeal': recruitSeal,
    'recruit.instructor.recruitAnchorIso': recruitSeal.start,
    'recruit.instructor.finalAnnounceIso': recruitSeal.end,
    'recruit.instructor.recruitTargets': instructorTargets.map(option => option.value),
    'recruit.instructor.recruitTargetDetail': instructorTargets
      .map(option => INSTRUCTOR_TARGET_DETAIL[option.value] ?? option.label)
      .join(', '),
    'recruit.volunteer.announcementPublished': 'published',
    'recruit.volunteer.interviewRequired': 'yes',
    'recruit.volunteer.programRangeSeal': programSeal,
    'recruit.volunteer.programAnchorIso': programSeal.start,
    'recruit.volunteer.recruitRangeSeal': recruitSeal,
    'recruit.volunteer.recruitAnchorIso': recruitSeal.start,
    'recruit.volunteer.finalAnnounceIso': recruitSeal.end,
    'recruit.volunteer.volunteerTargets': volunteerTargets.map(option => option.value),
    'recruit.volunteer.volunteerTargetDetail': volunteerTargets
      .map(option => VOLUNTEER_TARGET_DETAIL[option.value] ?? option.label)
      .join(', '),
    'recruit.volunteer.docDeadlineIso': recruitSeal.start,
    'recruit.volunteer.docAnnounceMethod': pick(RECRUIT_ANNOUNCE_METHODS),
    'recruit.volunteer.interviewRangeSeal': interviewSeal,
    'recruit.volunteer.interviewAnchorIso': interviewSeal.start,
    'recruit.volunteer.interviewMethod': pick(INTERVIEW_METHOD_OPTIONS).value,
    'recruit.volunteer.interview.interviewTimeRange': [
      interviewClockStart.toISOString(),
      interviewClockEnd.toISOString(),
    ],
    'recruit.volunteer.interview.timeUnit': '30',
    'recruit.volunteer.interview.selectedSlotKeys': [
      `${interviewClockStart.valueOf()}-${firstSlotEnd.valueOf()}`,
    ],
    'recruit.volunteer.interview.exclusionState': createDefaultUnavailableDatesExclusionState(),
    'recruit.volunteer.interview.exceptionDate': interviewSeal.start,
    'recruit.volunteer.interview.interviewTime': interviewClockStart.toISOString(),
    ...recruitDetailPatch(
      'recruit.detailInfo',
      ['programDescription', 'recruitmentGuide', 'applicationMethod', 'learningSupportContent'],
      titleKo,
      economyRecruit
    ),
    ...recruitDetailPatch(
      'economyRecruit.detailInfo',
      ['programDescription', 'recruitmentGuide', 'applicationMethod', 'learningSupportContent'],
      titleKo,
      economyRecruit
    ),
    ...recruitDetailPatch(
      'trainedTeachersRecruit.detailInfo',
      ['programDescription', 'recruitmentGuide', 'applicationMethod', 'learningSupportContent'],
      titleKo
    ),
    ...recruitDetailPatch(
      'ujatRecruit.detailInfo',
      ['programDescription', 'recruitmentGuide', 'applicationMethod', 'learningSupportContent'],
      titleKo
    ),
    ...recruitDetailPatch(
      'recruitInstructor.detailInfo',
      ['programDescription', 'recruitmentGuide', 'applicationMethod', 'otherNotes'],
      titleKo,
      economyRecruit
    ),
    ...recruitDetailPatch(
      'recruitVolunteer.detailInfo',
      ['programDescription', 'recruitmentGuide', 'applicationMethod', 'otherNotes'],
      titleKo
    ),
    ...(economyRecruit
      ? {
          'recruit.notes': economyRecruit.notes,
          'recruit.instructor.notes': economyRecruit.notes,
        }
      : {}),
  }
  applyDevAutofillRecruitOverlayPartials(args.variant, args.participant, {
    institution: institutionPartial,
    general: generalPartial,
  })
}

function buildUjatRecruitInfoOverlay(
  plan: ReturnType<typeof buildRegistrationDatePlan>,
  titleKo: string
): Record<string, unknown> {
  const programSeal = { ...plan.program }
  const recruitSeal = { ...plan.recruit }
  const interviewSeal = { ...plan.interview }
  const educationTargets = pickSome(EDUCATION_TARGET_OPTIONS, pickInt(1, 2))
  const volunteerTargets = pickSome(EDUCATION_TARGET_OPTIONS, pickInt(1, 2))
  const institutionKeys = UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  const volunteerKeys = UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS
  const contact = {
    name: pick(RECRUIT_CONTACTS),
    phone: pick(RECRUIT_PHONES),
    email: pick(RECRUIT_EMAILS),
  }
  const announceMethod = pick(RECRUIT_ANNOUNCE_METHODS)
  return {
    [institutionKeys.announcementPublished]: true,
    [institutionKeys.publicTitle]: `${titleKo} 참여 기관 모집`,
    [institutionKeys.programRange]: programSeal,
    [institutionKeys.targetLevels]: educationTargets.map(option => option.value),
    [institutionKeys.district]: educationTargets
      .map(option => EDUCATION_TARGET_DETAIL[option.value] ?? option.label)
      .join(', '),
    [institutionKeys.recruitRange]: recruitSeal,
    [institutionKeys.resultAnnounce]: { date: recruitSeal.end, method: announceMethod },
    [institutionKeys.contact]: contact,
    [institutionKeys.notes]: pick(RECRUIT_NOTES),
    [institutionKeys.description]: `${titleKo}는 학교 현장에서 경제·금융 기초를 익히는 참여형 교육입니다.`,
    [institutionKeys.recruitmentGuide]: '신청서 제출 후 담당자 확인을 거쳐 참여 학교를 확정합니다.',
    [institutionKeys.applicationMethod]:
      '온라인 신청서 작성 후 제출해 주세요. 추가 서류는 담당자가 안내합니다.',
    [institutionKeys.learningSupportContent]:
      '교재와 활동지를 제공하고, 수업 전 강사 사전 연수를 진행합니다.',
    [institutionKeys.additionalContentHtml]: `<p>${titleKo} 참여를 희망하는 학교는 모집 기간 안에 신청해 주세요.</p>`,
    [institutionKeys.attachmentFileNames]: [],
    ...buildUjatVolunteerHalfRecruitOverlay('h1', titleKo, {
      programSeal,
      recruitSeal,
      interviewSeal,
      volunteerTargets,
    }),
    ...buildUjatVolunteerHalfRecruitOverlay('h2', titleKo, {
      programSeal,
      recruitSeal,
      interviewSeal,
      volunteerTargets,
    }),
    [volunteerKeys.recruitRangeH1]: recruitSeal,
    [volunteerKeys.recruitRangeH2]: recruitSeal,
    [volunteerKeys.activityTermH1]: String(pickInt(1, 8)),
    [volunteerKeys.activityTermH2]: String(pickInt(9, 16)),
  }
}

function buildUjatVolunteerHalfRecruitOverlay(
  half: UjatVolunteerRecruitHalf,
  titleKo: string,
  args: {
    programSeal: { start: string; end: string }
    recruitSeal: { start: string; end: string }
    interviewSeal: { start: string; end: string }
    volunteerTargets: { label: string; value: string }[]
  }
): Record<string, unknown> {
  const halfLabel = half === 'h1' ? '상반기' : '하반기'
  const announceMethod = pick(RECRUIT_ANNOUNCE_METHODS)
  return {
    [ujatVolunteerHalfOverlayKey(half, 'announcementPublished')]: true,
    ...(half === 'h2'
      ? {
          [ujatVolunteerHalfOverlayKey(half, 'noticeExposure')]: pick(
            UJAT_VOLUNTEER_NOTICE_EXPOSURE_VALUES
          ),
        }
      : {}),
    [ujatVolunteerHalfOverlayKey(half, 'publicTitle')]: `${titleKo} ${halfLabel} 봉사자 모집`,
    [ujatVolunteerHalfOverlayKey(half, 'programRange')]: args.programSeal,
    [ujatVolunteerHalfOverlayKey(half, 'volunteerTargets')]: args.volunteerTargets.map(
      option => option.value
    ),
    [ujatVolunteerHalfOverlayKey(half, 'targetDetail')]: args.volunteerTargets
      .map(option => VOLUNTEER_TARGET_DETAIL[option.value] ?? `${option.label} 대상`)
      .join(', '),
    [ujatVolunteerHalfOverlayKey(half, 'docAnnounce')]: {
      date: args.recruitSeal.start,
      method: pick(RECRUIT_ANNOUNCE_METHODS),
    },
    [ujatVolunteerHalfOverlayKey(half, 'interviewRange')]: args.interviewSeal,
    [ujatVolunteerHalfOverlayKey(half, 'interviewMethod')]: pick(['온라인', '오프라인'] as const),
    [ujatVolunteerHalfOverlayKey(half, 'finalAnnounce')]: {
      date: args.recruitSeal.end,
      method: announceMethod,
    },
    [ujatVolunteerHalfOverlayKey(half, 'contact')]: {
      name: pick(RECRUIT_CONTACTS),
      phone: pick(RECRUIT_PHONES),
      email: pick(RECRUIT_EMAILS),
    },
    [ujatVolunteerHalfOverlayKey(half, 'notes')]: pick(RECRUIT_NOTES),
    [ujatVolunteerHalfOverlayKey(half, 'otherNotes')]: pick(RECRUIT_NOTES),
    [ujatVolunteerHalfOverlayKey(half, 'description')]:
      `${titleKo} ${halfLabel} 봉사단과 함께 학교 교육을 진행합니다.`,
    [ujatVolunteerHalfOverlayKey(half, 'recruitmentGuide')]:
      `${halfLabel} 서류 심사 후 면접을 진행합니다.`,
    [ujatVolunteerHalfOverlayKey(half, 'applicationMethod')]:
      `${halfLabel} 온라인 신청서 작성 후 제출해 주세요.`,
    [ujatVolunteerHalfOverlayKey(half, 'additionalContentHtml')]:
      `<p>${titleKo} ${halfLabel} 모집 관련 안내입니다.</p>`,
    [ujatVolunteerHalfOverlayKey(half, 'attachmentFileNames')]: [],
  }
}

function buildDevAutofillSample(): DevAutofillSample {
  const program = pick(PROGRAM_SAMPLES)
  const venueKind = pick(VENUE_KINDS)
  const dates = buildRegistrationDatePlan()
  const bizStart = dayjs(dates.business.start)
  const periodEnd = bizStart.add(pickInt(3, 8), 'week')
  const slots = [...TIME_SLOTS].sort(() => Math.random() - 0.5).slice(0, 2)
  const scheduleLines = [0, 1].map(index => {
    const date = bizStart.add(index * 7, 'day')
    const slot = slots[index] ?? TIME_SLOTS[0]
    return formatEducationScheduleLineFromRange([
      atClock(date, slot.startHour, slot.startMinute),
      atClock(date, slot.endHour, slot.endMinute),
    ])
  })
  const ipsCategory = pickOptionValue(PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS) as
    | 'inspire'
    | 'prepare'
    | 'succeed'
  const grade2 = pick([80_000, 100_000, 120_000, 150_000])
  const distance2 = pick([20_000, 30_000, 40_000, 50_000])
  const school = pickInt(3, 12)
  const units = [...UNIT_SAMPLES].sort(() => Math.random() - 0.5).slice(0, 2)

  return {
    titleKo: program.titleKo,
    titleEn: program.titleEn,
    publicTitle: program.publicTitle,
    operationRange: dates.business,
    scheduleLines,
    periodRange: {
      start: dates.business.start,
      end: periodEnd.isAfter(dayjs(dates.business.end)) ? dates.business.end : dayIso(periodEnd),
    },
    recruitDates: dates,
    venueKind,
    venueDetail: pick(VENUE_DETAILS[venueKind]),
    businessField: pickOptionValue(TEMPLATE_FORM_BUSINESS_AREA_OPTIONS),
    educationCourse: pickOptionValue(TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS),
    ipOwned: pickOptionValue(TEMPLATE_FORM_IP_OWNED_OPTIONS),
    courseDeliveredBy: pickOptionValue(TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS),
    partnerInvolvement: pickOptionValue(TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS) as 'yes' | 'no',
    ipsCategory,
    ipsDetail: ipsDetailForCategory(ipsCategory),
    units,
    kpi: {
      participant: pickInt(24, 80),
      instructor: pickInt(2, 8),
      volunteer: pickInt(4, 20),
      school,
      classCount: school + pickInt(2, 10),
    },
    wages: {
      grade1: grade2 + 20_000,
      grade2,
      grade3: grade2 - 20_000,
      grade1Distance: distance2 + 10_000,
      grade2Distance: distance2,
      grade3Distance: Math.max(10_000, distance2 - 10_000),
    },
    survey: {
      survey: true,
      satisfaction: Math.random() > 0.25,
      lecture_evaluation: Math.random() > 0.45,
    },
    eventNames: [units[0]?.name ?? '1차 교육', units[1]?.name ?? '2차 교육'],
  }
}

/**
 * 교육받은 교사 등록용 개발 샘플.
 *
 * 일반 프로그램의 청소년·학급 수업 샘플을 재사용하면 교육받은 교사 폼에
 * 없는 KPI·강사비가 overlay에 섞이고, 교사 연수 프로그램이라는 화면의
 * 목적도 드러나지 않는다. 이 샘플은 학교/교사 주도 교육에 맞는 값만
 * 고정하고, 날짜·운영 기간은 기존 개발용 계획을 재사용한다.
 */
function buildTrainedTeachersDevAutofillSample(): DevAutofillSample {
  const sample = buildDevAutofillSample()
  return {
    ...sample,
    titleKo: '2026 JA Korea 중등 교사 디지털 금융교육 연수',
    titleEn: '2026 JA Korea Digital Finance Training for Middle School Teachers',
    publicTitle: '2026 JA Korea 중등 교사 디지털 금융교육 연수 참가자 모집',
    venueKind: 'inside',
    venueDetail: '학교 시청각실',
    businessField: 'economy_finance',
    educationCourse: 'digital_computer',
    ipOwned: 'ja',
    courseDeliveredBy: 'ja',
    partnerInvolvement: 'no',
    ipsCategory: 'prepare',
    ipsDetail: 'none',
    units: [
      {
        name: '교사 금융교육 역량 이해',
        content: '학교 수업에 적용할 금융교육의 목표와 교사의 역할을 이해합니다.',
      },
      {
        name: '디지털 금융수업 설계 실습',
        content: '디지털 자료를 활용해 학생 참여형 금융수업을 설계하고 공유합니다.',
      },
    ],
    survey: {
      survey: true,
      satisfaction: true,
      lecture_evaluation: true,
    },
    eventNames: ['교사 금융교육 연수', '수업 적용 사례 나눔'],
  }
}

/** 1사1교 폼에 고정으로 노출되는 「전체」 옵션 값 */
const ECONOMY_ALL_VALUE = '__all__' as const
/** 1사1교·교육받은 교사 대표 세부 프로그램 라벨 — 카탈로그에서 이 라벨의 실제 마스터 id 를 우선 선택 (basic-info-defaults.ts REP_KO와 동일) */
const ECONOMY_DETAILED_PROGRAM_MAIN_LABEL = '1사1교 경제금융교육' as const

function ipsDetailForCategory(category: DevAutofillSample['ipsCategory']): string {
  const options =
    category === 'inspire'
      ? PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS
      : category === 'succeed'
        ? PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS
        : [{ value: 'none', label: '해당 없음' }]
  const meaningful = options.filter(option => option.value !== 'none')
  return pickOptionValue(meaningful.length > 0 ? meaningful : options, 'none')
}

/**
 * 담당자 셀렉트 값.
 * 일반·교육받은 교사는 `후원사id::담당자id`. 담당자가 없으면 미선택.
 */
function toSponsorContactSelectValue(
  sponsorId: string,
  contactId: string,
  encoded: boolean
): string {
  const sponsor = sponsorId.trim()
  const contact = contactId.trim()
  if (!sponsor) return ''
  if (sponsor === ECONOMY_ALL_VALUE || sponsor === UJAT_SPONSOR_ALL_VALUE) return sponsor
  if (!contact) return SPONSOR_CONTACT_UNSELECTED_VALUE
  return encoded ? encodeSponsorManagerContactRef(sponsor, contact) : contact
}

async function resolveSponsorAndContact(allowAllSentinel: boolean): Promise<{
  sponsorId: string
  contactId: string
}> {
  const empty = allowAllSentinel
    ? { sponsorId: UJAT_SPONSOR_ALL_VALUE, contactId: UJAT_SPONSOR_ALL_VALUE }
    : { sponsorId: '', contactId: '' }
  if (!shouldUseSponsorsRemoteApi()) return empty
  try {
    const sponsors = await getSponsorOptionsList()
    if (sponsors.length === 0) return empty
    const ordered = [...sponsors]
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
    }
    for (const sponsor of ordered) {
      if (!sponsor?.id) continue
      const sponsorId = String(sponsor.id).trim()
      const contacts = await getSponsorContacts(sponsorId)
      if (contacts.length === 0) continue
      const contact = pick(contacts)
      if (!contact?.id) continue
      return { sponsorId, contactId: String(contact.id).trim() }
    }
    const fallback = pick(sponsors)
    if (!fallback?.id) return empty
    return { sponsorId: String(fallback.id).trim(), contactId: '' }
  } catch {
    return empty
  }
}

type ResolveDetailedProgramOptions = {
  /**
   * 「해당없음」을 후보에 포함할지. BE는 커리큘럼형에 세부 프로그램 마스터 id(숫자)를 요구하므로
   * 일반 일정형에서만 true.
   */
  includeNone: boolean
  /** 카탈로그에 같은 라벨이 있으면 무작위 대신 그 항목을 우선 선택 (1사1교·교육받은 교사 대표 프로그램) */
  preferLabel?: string
}

/**
 * 버그 수정: 기존엔 id만 무작위로 골라 overlay `detailedProgramId`에만 넣고
 * `detailedProgramName`은 비워둬서, 실제 선택 라벨(예: 세부 프로그램 관리에 남아있는
 * 테스트용 「삭제 가능 샘플」)과 저장되는 이름이 어긋나 보이는 문제가 있었다.
 * id·name을 항상 짝지어 반환해 `setDetailedProgramSelection`과 동일하게 동기화한다.
 *
 * 가짜 sentinel(`__economy_1c1s_main__` 등)은 후보에 넣지 않는다 — 요청 body에서 빠져 커리큘럼형 등록이 거절된다.
 */
async function resolveDetailedProgram(
  options: ResolveDetailedProgramOptions
): Promise<{ id: string; name: string }> {
  const pool: { value: string; label: string }[] = []
  try {
    const rows = await getDetailedProgramOptionsList()
    for (const row of rows) {
      if (isDetailedProgramMasterId(row.id))
        pool.push({ value: String(row.id), label: row.name ?? '' })
    }
  } catch {
    /* remote 미연동·실패 시 빈 후보 */
  }
  const preferLabel = options.preferLabel?.trim()
  if (preferLabel) {
    const preferred = pool.find(option => option.label.trim() === preferLabel)
    if (preferred) return { id: preferred.value, name: preferred.label }
  }
  if (options.includeNone) pool.push({ ...TEMPLATE_FORM_DETAILED_PROGRAM_NONE_OPTION })
  // 커리큘럼형인데 카탈로그가 비어 있으면 채울 수 있는 값이 없다 — 미선택으로 두고 필수 검증에 맡긴다.
  if (pool.length === 0) return { id: '', name: '' }
  const picked = pick(pool)
  return { id: String(picked.value).trim(), name: picked.label.trim() }
}

/**
 * 폼 셀렉트와 같은 소스에서 지급 항목을 고른다.
 * remote 정산 설정이 켜져 있으면 API 카탈로그(캐시 우선), 아니면 mock.
 * mock id(`p-1`)를 remote 옵션에 넣으면 셀렉트가 옵션 밖 값으로 보인다.
 */
async function resolvePaymentItemOptions(): Promise<{ value: string; label: string }[]> {
  await ensurePaymentItemCatalog()
  return getActivePaymentItemCatalogOptions()
}

async function pickPaymentItemSelection(): Promise<{ ids: string[]; labels: string }> {
  const options = await resolvePaymentItemOptions()
  if (options.length === 0) return { ids: [], labels: '' }
  const count = Math.min(options.length, pickInt(1, 2))
  const shuffled = [...options].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, count)
  return {
    ids: picked.map(option => option.value),
    labels: picked
      .map(option => option.label.trim())
      .filter(Boolean)
      .join(', '),
  }
}

const EDUCATION_FORM_VALUES = ['online', 'offline', 'hybrid'] as const
const PARTICIPATION_VALUES = ['individual', 'team'] as const
const SCHEDULE_DETAIL_KINDS = ['common', 'perSchedule'] as const
const GROUP_TIME_SLOTS = [
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '13:30', endTime: '15:30' },
  { startTime: '09:30', endTime: '11:30' },
  { startTime: '14:00', endTime: '16:30' },
] as const

export type ProgramRegistrationDevAutofillLayout = {
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  participantOrganization: boolean
  programType: 'curriculum' | 'schedule'
  sessionRoundType: 'single' | 'multi'
  /** 교육받은 교사 — 교육 연수 토글. 켜져 있으면 진행 일정이 필수다. */
  teacherTrainingEnabled?: boolean
  /** 교육받은 교사 필수 검사에 쓰는 참여자 선택. 없으면 학교/기관만 선택한 것으로 본다. */
  participant?: TrainedTeachersRegistrationRequiredFieldContext['participant']
}

export type ProgramRegistrationDevAutofillTypeSettings = {
  programType: 'curriculum' | 'schedule'
  sessionRoundType: 'single' | 'multi'
  educationFormScheduleDetail: 'common' | 'perSchedule'
  participationScheduleDetail: 'common' | 'perSchedule'
  ipsScheduleDetail: 'common' | 'perSchedule'
  educationForm: string
  participation: 'individual' | 'team'
  educationScheduleMode: 'date' | 'period'
}

const DEFAULT_AUTOFILL_LAYOUT: ProgramRegistrationDevAutofillLayout = {
  curriculumSessionCount: 1,
  curriculumChartSessionCount: 1,
  scheduleCurriculumDetailCount: 1,
  scheduleCurriculumGroupCount: 1,
  participantOrganization: false,
  programType: 'curriculum',
  sessionRoundType: 'single',
}

function rowCount(value: number): number {
  return Math.max(1, Math.floor(value) || 1)
}

function indexRecord<T>(count: number, valueAt: (index: number) => T): Record<number, T> {
  const record: Record<number, T> = {}
  for (let index = 1; index <= rowCount(count); index += 1) {
    record[index] = valueAt(index)
  }
  return record
}

function unitText(sample: DevAutofillSample, index: number, field: 'name' | 'content'): string {
  const unit = UNIT_SAMPLES[(index - 1) % UNIT_SAMPLES.length] ?? sample.units[0]
  return unit?.[field] ?? ''
}

function scheduleLineAt(index: number): string {
  const date = upcomingWeekday(14 + (index - 1) * 7)
  const slot = TIME_SLOTS[(index - 1) % TIME_SLOTS.length] ?? TIME_SLOTS[0]
  return formatEducationScheduleLineFromRange([
    atClock(date, slot.startHour, slot.startMinute),
    atClock(date, slot.endHour, slot.endMinute),
  ])
}

function randomIps(): { category: DevAutofillSample['ipsCategory']; detail: string } {
  const category = pickOptionValue(PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS) as
    | 'inspire'
    | 'prepare'
    | 'succeed'
  return { category, detail: ipsDetailForCategory(category) }
}

function buildTypeSettings(
  variant: ProgramRegistrationFormVariant | 'ujat'
): Omit<ProgramRegistrationDevAutofillTypeSettings, 'educationScheduleMode'> {
  if (variant === 'trainedTeachers') {
    return {
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      educationForm: 'offline',
      participation: 'individual',
    }
  }
  return {
    programType: variant === 'economy' ? 'curriculum' : pick(['curriculum', 'schedule']),
    sessionRoundType: variant === 'economy' ? 'single' : pick(['single', 'multi']),
    educationFormScheduleDetail: pick(SCHEDULE_DETAIL_KINDS),
    participationScheduleDetail: pick(SCHEDULE_DETAIL_KINDS),
    ipsScheduleDetail: pick(SCHEDULE_DETAIL_KINDS),
    educationForm:
      variant === 'economy'
        ? pick([...EDUCATION_FORM_VALUES, EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE])
        : pick(EDUCATION_FORM_VALUES),
    participation: variant === 'economy' ? 'individual' : pick(PARTICIPATION_VALUES),
  }
}

function periodScheduleLine(index: number): string {
  const start = upcomingWeekday(18 + (index - 1) * 14)
  let end = start.add(pickInt(4, 16), 'day')
  while (end.day() === 0 || end.day() === 6) end = end.add(1, 'day')
  return formatEducationScheduleLineFromRange([start.startOf('day'), end.startOf('day')])
}

function buildEducationSchedulePreviewLines(mode: 'date' | 'period', lineCount?: number): string[] {
  const count = lineCount ?? pickInt(1, 5)
  return Array.from({ length: count }, (_, index) =>
    mode === 'period' ? periodScheduleLine(index + 1) : scheduleLineAt(index + 1)
  )
}

const DEV_AUTOFILL_FIXED_IPS = { category: 'prepare' as const, detail: 'none' }

function assignmentEntryForPolicy(
  policy: GeneralRegistrationDevAutofillOverlayBehavior['assignmentPolicy'] | undefined,
  index: number,
  legacyDefault?: boolean
): { enabled: boolean; period: string } {
  if (policy === 'disabled') return { enabled: false, period: '' }
  if (policy === 'enabledWithPeriod') return { enabled: true, period: scheduleLineAt(index) }
  if (policy === 'none') return { enabled: false, period: '' }
  if (legacyDefault) return { enabled: true, period: scheduleLineAt(index) }
  return { enabled: false, period: '' }
}

function canVaryEducationSchedulePeriod(input: {
  variant: ProgramRegistrationFormVariant | 'ujat'
  programType: 'curriculum' | 'schedule'
  sessionRoundType: 'single' | 'multi'
  participantOrganization: boolean
}): boolean {
  if (input.variant === 'trainedTeachers') return true
  if (input.variant !== 'general') return false
  if (input.programType === 'schedule' && input.sessionRoundType === 'multi') return false
  return !shouldDisableEducationSchedulePeriodMode({
    participantOrganization: input.participantOrganization,
    sessionRound: input.sessionRoundType,
  })
}

function finalizeTypeSettings(
  variant: ProgramRegistrationFormVariant | 'ujat',
  layout: ProgramRegistrationDevAutofillLayout,
  preferredEducationScheduleMode?: 'date' | 'period'
): ProgramRegistrationDevAutofillTypeSettings {
  const drafted = buildTypeSettings(variant)
  const keepVisibleRows =
    (layout.programType === 'schedule' && layout.scheduleCurriculumDetailCount > 1) ||
    (layout.programType !== 'schedule' &&
      ((layout.sessionRoundType === 'multi' && layout.curriculumSessionCount > 1) ||
        (layout.sessionRoundType !== 'multi' && layout.curriculumChartSessionCount > 1)))
  const programType =
    variant === 'economy' || variant === 'trainedTeachers' || keepVisibleRows
      ? variant === 'economy'
        ? 'curriculum'
        : layout.programType
      : drafted.programType
  const sessionRoundType =
    variant === 'economy'
      ? 'single'
      : variant === 'trainedTeachers' || keepVisibleRows
        ? layout.sessionRoundType
        : drafted.sessionRoundType
  const educationScheduleMode =
    variant === 'economy'
      ? 'period'
      : variant === 'trainedTeachers'
        ? (preferredEducationScheduleMode ?? 'date')
        : canVaryEducationSchedulePeriod({
              variant,
              programType,
              sessionRoundType,
              participantOrganization: layout.participantOrganization,
            })
          ? pick(['date', 'period'] as const)
          : 'date'
  return {
    ...drafted,
    programType,
    sessionRoundType,
    educationScheduleMode,
  }
}

function buildGeneralLikeOverlay(
  sample: DevAutofillSample,
  basicPrefix: string,
  kpiPrefix: string,
  curriculumPrefix: string,
  schedulePrefix: string,
  titleKoKey: string,
  typeSettingsPrefix: string,
  layout: ProgramRegistrationDevAutofillLayout,
  typeSettings: ProgramRegistrationDevAutofillTypeSettings,
  educationScheduleLines: readonly string[],
  resolved: {
    sponsorId: string
    contactId: string
    detailedProgramId: string
    detailedProgramName: string
    paymentItemValues: string[]
    paymentItemLabels: string
  },
  overlayBehavior?: GeneralRegistrationDevAutofillOverlayBehavior
): Record<string, unknown> {
  const detailCount = rowCount(layout.scheduleCurriculumDetailCount)
  const groupCount = rowCount(layout.scheduleCurriculumGroupCount)
  const chartCount = rowCount(layout.curriculumChartSessionCount)
  const roundCount = rowCount(layout.curriculumSessionCount)
  const sessionSpan = Math.max(chartCount, roundCount)
  const deterministic = overlayBehavior != null
  const educationFormByIndex = (count: number) =>
    indexRecord(count, () =>
      deterministic ? typeSettings.educationForm : pick(EDUCATION_FORM_VALUES)
    )
  const participationByIndex = (count: number) =>
    indexRecord(count, () =>
      deterministic ? typeSettings.participation : pick(PARTICIPATION_VALUES)
    )
  const ipsAt = () => (deterministic ? DEV_AUTOFILL_FIXED_IPS : randomIps())
  return {
    [`${basicPrefix}.programTitleEn`]: sample.titleEn,
    [`${basicPrefix}.publicProgramTitle`]: sample.publicTitle,
    [`${basicPrefix}.detailedProgramId`]: resolved.detailedProgramId,
    // 버그 수정: id만 넣고 name을 비워두면 실제 저장되는 세부 프로그램명이
    // 선택된 id와 어긋나 보일 수 있다 — 항상 짝지어 넣는다.
    [`${basicPrefix}.detailedProgramName`]: resolved.detailedProgramName,
    [`${basicPrefix}.operationRangeSeal`]: { ...sample.operationRange },
    [`${basicPrefix}.businessField`]: sample.businessField,
    [`${basicPrefix}.educationVenueKind`]: sample.venueKind,
    [`${basicPrefix}.educationVenueDetail`]: sample.venueDetail,
    [`${basicPrefix}.surveyItems`]: { ...sample.survey },
    [`${basicPrefix}.educationCourse`]: sample.educationCourse,
    [`${basicPrefix}.ipOwned`]: sample.ipOwned,
    [`${basicPrefix}.courseDeliveredBy`]: sample.courseDeliveredBy,
    [`${basicPrefix}.partnerInvolvement`]: sample.partnerInvolvement,
    [`${kpiPrefix}.participantCount`]: sample.kpi.participant,
    [`${kpiPrefix}.instructor`]: sample.kpi.instructor,
    [`${kpiPrefix}.volunteer`]: sample.kpi.volunteer,
    [`${kpiPrefix}.dispatchedSchool`]: sample.kpi.school,
    [`${kpiPrefix}.dispatchedClass`]: sample.kpi.classCount,
    'generalRegistration.wageInfo.grade1Fee': sample.wages.grade1,
    'generalRegistration.wageInfo.grade2Fee': sample.wages.grade2,
    'generalRegistration.wageInfo.grade3Fee': sample.wages.grade3,
    'generalRegistration.wageInfo.paymentItemValues': resolved.paymentItemValues,
    'generalRegistration.wageInfo.paymentItemLabels':
      resolved.paymentItemLabels || PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
    [`${typeSettingsPrefix}.ipsType`]: deterministic
      ? DEV_AUTOFILL_FIXED_IPS
      : {
          category: sample.ipsCategory,
          detail: sample.ipsDetail,
        },
    [`${typeSettingsPrefix}.singleEducationForm`]: typeSettings.educationForm,
    [`${typeSettingsPrefix}.multiCommonEducationForm`]: typeSettings.educationForm,
    [`${typeSettingsPrefix}.educationForm`]: typeSettings.educationForm,
    [`${typeSettingsPrefix}.singleParticipation`]: typeSettings.participation,
    [`${typeSettingsPrefix}.multiCommonParticipation`]: typeSettings.participation,
    [`${curriculumPrefix}.unitNameBySession`]: indexRecord(chartCount, index =>
      unitText(sample, index, 'name')
    ),
    [`${curriculumPrefix}.unitContentBySession`]: indexRecord(chartCount, index =>
      unitText(sample, index, 'content')
    ),
    'generalRegistration.educationCurriculum.educationFormBySession':
      educationFormByIndex(sessionSpan),
    'generalRegistration.educationCurriculum.participationBySession':
      participationByIndex(sessionSpan),
    'generalRegistration.educationCurriculum.ipsBySession': indexRecord(sessionSpan, () => ipsAt()),
    'generalRegistration.educationCurriculum.progressSessionByRound': indexRecord(
      roundCount,
      index => String(((index - 1) % 16) + 1)
    ),
    'generalRegistration.educationCurriculum.roundContentByRound': indexRecord(roundCount, index =>
      unitText(sample, index, 'content')
    ),
    ...(typeSettings.sessionRoundType === 'multi'
      ? {
          'generalRegistration.educationCurriculum.assignmentByRound': indexRecord(
            roundCount,
            index =>
              assignmentEntryForPolicy(
                overlayBehavior?.assignmentPolicy,
                index,
                overlayBehavior == null
              )
          ),
        }
      : {}),
    [`${schedulePrefix}.scheduleLines`]: [...educationScheduleLines],
    'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': indexRecord(
      detailCount,
      index => scheduleLineAt(index)
    ),
    'generalRegistration.educationScheduleCurriculum.eventNameByDetail': indexRecord(
      detailCount,
      index => unitText(sample, index, 'name')
    ),
    'generalRegistration.educationScheduleCurriculum.educationFormByDetail':
      educationFormByIndex(detailCount),
    'generalRegistration.educationScheduleCurriculum.participationByDetail':
      participationByIndex(detailCount),
    'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex': indexRecord(
      detailCount,
      () => ipsAt()
    ),
    ...(overlayBehavior?.assignmentPolicy !== 'none' || overlayBehavior == null
      ? {
          'generalRegistration.educationScheduleCurriculum.assignmentByDetail': indexRecord(
            detailCount,
            index =>
              assignmentEntryForPolicy(
                overlayBehavior?.assignmentPolicy,
                index,
                overlayBehavior == null
              )
          ),
        }
      : {}),
    ...(typeSettings.programType === 'schedule' &&
    (overlayBehavior == null ||
      (typeSettings.sessionRoundType === 'single' && overlayBehavior.scheduleSingleUsesGroupTimes))
      ? {
          'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': indexRecord(
            detailCount,
            index =>
              Array.from({ length: groupCount }, (_, groupIndex) => ({
                ...GROUP_TIME_SLOTS[(index + groupIndex) % GROUP_TIME_SLOTS.length],
              }))
          ),
        }
      : {}),
    [titleKoKey]: sample.titleKo,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY]: resolved.sponsorId,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]: resolved.sponsorId ? [resolved.sponsorId] : [],
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: resolved.contactId,
    [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]: resolved.contactId
      ? [resolved.contactId]
      : [],
  }
}

function buildEconomyOverlay(
  sample: DevAutofillSample,
  resolved: {
    sponsorId: string
    contactId: string
    detailedProgramId: string
    detailedProgramName: string
    paymentItemValues: string[]
  }
): Record<string, unknown> {
  const p = 'economyRegistration.basicInfo'
  const sponsorId = resolved.sponsorId || ECONOMY_ALL_VALUE
  const contactId = resolved.contactId || (sponsorId === ECONOMY_ALL_VALUE ? ECONOMY_ALL_VALUE : '')
  return {
    [`${p}.repKo`]: sample.titleKo,
    [`${p}.repEn`]: sample.titleEn,
    [`${p}.publicProgramTitle`]: sample.publicTitle,
    [`${p}.detailedProgramId`]: resolved.detailedProgramId,
    [`${p}.detailedProgramName`]: resolved.detailedProgramName,
    [`${p}.operationRangeSeal`]: { ...sample.operationRange },
    [`${p}.businessField`]: sample.businessField,
    [`${p}.sponsorId`]: sponsorId,
    [`${p}.managerContactId`]: contactId,
    [`${p}.managerContactIds`]: contactId ? [contactId] : [],
    [`${p}.surveyItems`]: { ...sample.survey },
    [`${p}.educationCourse`]: sample.educationCourse,
    [`${p}.ipOwned`]: sample.ipOwned,
    [`${p}.courseDeliveredBy`]: sample.courseDeliveredBy,
    [`${p}.partnerInvolvement`]: sample.partnerInvolvement,
    [`${p}.ipsCategory`]: sample.ipsCategory,
    'economyRegistration.kpi.participantCount': sample.kpi.participant,
    'economyRegistration.kpi.instructor': sample.kpi.instructor,
    'economyRegistration.kpi.dispatchedSchool': sample.kpi.school,
    'economyRegistration.kpi.dispatchedClass': sample.kpi.classCount,
    'economyRegistration.educationCurriculum.session1.title': sample.units[0]?.name ?? '',
    'economyRegistration.educationCurriculum.session1.description': sample.units[0]?.content ?? '',
    'economyRegistration.educationCurriculum.session2.title': sample.units[1]?.name ?? '',
    'economyRegistration.educationCurriculum.session2.description': sample.units[1]?.content ?? '',
    'economyRegistration.educationScheduleSettings.dateRangeSeal': { ...sample.periodRange },
    'economyRegistration.wageInfo.grade1Fee': sample.wages.grade1,
    'economyRegistration.wageInfo.grade1DistanceFee': sample.wages.grade1Distance,
    'economyRegistration.wageInfo.grade2Fee': sample.wages.grade2,
    'economyRegistration.wageInfo.grade2DistanceFee': sample.wages.grade2Distance,
    'economyRegistration.wageInfo.grade3Fee': sample.wages.grade3,
    'economyRegistration.wageInfo.grade3DistanceFee': sample.wages.grade3Distance,
    'economyRegistration.wageInfo.paymentItemValues': resolved.paymentItemValues,
  }
}

function existingUjatScheduleRowIds(overlay: Record<string, unknown>, key: string): number[] {
  const raw = overlay[key]
  if (!raw || typeof raw !== 'object') return [0]
  const rowIds = (raw as { rowIds?: unknown }).rowIds
  if (!Array.isArray(rowIds) || rowIds.length === 0) return [0]
  const ids = rowIds.map(id => Number(id)).filter(id => Number.isFinite(id))
  return ids.length > 0 ? ids : [0]
}

function dateInsideSpan(start: Dayjs, end: Dayjs, index: number): string {
  const lo = start.startOf('day')
  const hi = end.startOf('day')
  const span = Math.max(0, hi.diff(lo, 'day'))
  const offset = span === 0 ? 0 : (index * 3) % (span + 1)
  return lo.add(offset, 'day').toISOString()
}

function buildFilledScheduleBundle(
  rowIds: number[],
  start: Dayjs,
  end: Dayjs
): UjatHalfMultiScheduleBundle {
  const regions = [...listUjatEducationRegionsActive()].sort(() => Math.random() - 0.5)
  const regionByRow: Record<string, string[]> = {}
  const dateByRow: Record<string, string | null> = {}
  rowIds.forEach((id, index) => {
    const region = regions[index % Math.max(regions.length, 1)]
    regionByRow[String(id)] = region ? [region.key] : []
    dateByRow[String(id)] = dateInsideSpan(start, end, index)
  })
  return { rowIds, regionByRow, dateByRow }
}

function daysInsideRange(
  start: Dayjs,
  end: Dayjs,
  blockedDateKeys: ReadonlySet<string>,
  weekday?: number
): string[] {
  const lo = start.startOf('day')
  const hi = end.startOf('day')
  const from = lo.isAfter(hi, 'day') ? hi : lo
  const to = lo.isAfter(hi, 'day') ? lo : hi
  const dates: string[] = []
  for (let cursor = from; !cursor.isAfter(to, 'day'); cursor = cursor.add(1, 'day')) {
    if (weekday != null && cursor.day() !== weekday) continue
    const key = cursor.format('YYYY-MM-DD')
    if (blockedDateKeys.has(key)) continue
    dates.push(key)
  }
  return dates
}

function fridaysInsideEducationRange(
  start: Dayjs,
  end: Dayjs,
  blockedDateKeys: ReadonlySet<string>
): string[] {
  return daysInsideRange(start, end, blockedDateKeys, 5)
}

/** 없음 / 토·일·공휴일 조합. 직접 지정일은 picker 결과 중 체크된 제외일과 겹치지 않는다. */
function buildUnavailableSelection(
  start: Dayjs,
  end: Dayjs,
  picker: (start: Dayjs, end: Dayjs, blocked: ReadonlySet<string>) => string[]
): { exclusion: UnavailableDatesExclusionState; dates: string[] } {
  if (Math.random() < 0.25) {
    return {
      exclusion: {
        excludeNone: true,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: false,
      },
      dates: [],
    }
  }

  const exclusion: UnavailableDatesExclusionState = {
    excludeNone: false,
    excludeSaturday: Math.random() < 0.5,
    excludeSunday: Math.random() < 0.5,
    excludeHoliday: Math.random() < 0.5,
  }
  const blocked = new Set<string>(
    exclusion.excludeHoliday ? [...getPublicHolidayDateKeysForSchedule()] : []
  )
  const candidates = picker(start, end, blocked).filter(key => {
    const day = dayjs(key).day()
    if (exclusion.excludeSaturday && day === 6) return false
    if (exclusion.excludeSunday && day === 0) return false
    return true
  })
  const count = Math.min(pickInt(0, 3), candidates.length)
  const dates = [...candidates]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .sort()
  return { exclusion, dates }
}

function buildUjatUnavailableSelection(
  start: Dayjs,
  end: Dayjs
): { exclusion: UnavailableDatesExclusionState; dates: string[] } {
  return buildUnavailableSelection(start, end, fridaysInsideEducationRange)
}

function buildInterviewUnavailableSelection(
  start: Dayjs,
  end: Dayjs
): { exclusion: UnavailableDatesExclusionState; dates: string[] } {
  return buildUnavailableSelection(start, end, daysInsideRange)
}

function buildUjatHalfSchedule(
  half: UjatHalfSemesterKey,
  sample: DevAutofillSample,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const settingsKeys = ujatEducationScheduleSettingsOverlayKeys(half)
  const delivery = pick(EDUCATION_DELIVERIES)
  const halves = ujatAutofillHalfRanges(sample.operationRange)
  const eventStart = halves[half].start
  const eventEnd = halves[half].end
  const unavailable = buildUjatUnavailableSelection(eventStart, eventEnd)
  return {
    [keys.preName]: half === 'h1' ? '상반기 발대식' : '하반기 발대식',
    [keys.preDelivery]: delivery,
    [keys.preTextbookMode]: 'ja',
    [keys.preMulti]: buildFilledScheduleBundle(
      existingUjatScheduleRowIds(overlay, keys.preMulti),
      eventStart,
      eventEnd
    ),
    [keys.eventName]: sample.eventNames[half === 'h1' ? 0 : 1],
    [keys.eventRange]: { start: eventStart.toISOString(), end: eventEnd.toISOString() },
    [keys.eventDelivery]: delivery,
    [keys.closingName]: half === 'h1' ? '상반기 해단식' : '하반기 해단식',
    [keys.closingDelivery]: pick(EDUCATION_DELIVERIES),
    [keys.closingMulti]: buildFilledScheduleBundle(
      existingUjatScheduleRowIds(overlay, keys.closingMulti),
      eventStart,
      eventEnd
    ),
    [settingsKeys.exclusion]: unavailable.exclusion,
    [settingsKeys.unavailableDates]: unavailable.dates,
  }
}

function buildUjatRegionCapacity(): UjatRegionCapacityBySemesterState {
  const labels = listUjatEducationRegionsActive().map(row => row.label)
  const semester = () =>
    Object.fromEntries(
      labels.map(label => [
        label,
        {
          classCount: String(pickInt(4, 18)),
          volunteerCount: String(pickInt(6, 24)),
        },
      ])
    )
  return { h1: semester(), h2: semester() }
}

function buildUjatOverlay(
  sample: DevAutofillSample,
  resolved: { sponsorId: string; contactId: string }
): Record<string, unknown> {
  const sponsorId = resolved.sponsorId || UJAT_SPONSOR_ALL_VALUE
  const contactId =
    resolved.contactId || (sponsorId === UJAT_SPONSOR_ALL_VALUE ? UJAT_SPONSOR_ALL_VALUE : '')
  return {
    'ujat.basicInfo.repKo': sample.titleKo,
    'ujat.basicInfo.repEn': sample.titleEn,
    'ujat.basicInfo.programManagementName': `${sample.titleKo} 운영`,
    'ujat.basicInfo.detailedProgramId': UJAT_DETAILED_PROGRAM_UJAT_VALUE,
    // id만 넣고 name을 비워두면 실제 저장되는 세부 프로그램명이 어긋날 수 있다 — 항상 짝지어 넣는다.
    'ujat.basicInfo.detailedProgramName': UJAT_DETAILED_PROGRAM_UJAT_LABEL,
    'ujat.basicInfo.operationRangeSeal': { ...sample.operationRange },
    // 기간형 date picker가 표시할 기준일도 함께 기록한다. range만
    // 채우면 내부 anchor가 비어 있어 화면상 미입력으로 남을 수 있다.
    'ujat.basicInfo.operationAnchorIso': sample.operationRange.start,
    'ujat.basicInfo.businessField': sample.businessField,
    'ujat.basicInfo.educationCourse': sample.educationCourse,
    'ujat.basicInfo.ipOwned': sample.ipOwned,
    'ujat.basicInfo.courseDeliveredBy': sample.courseDeliveredBy,
    'ujat.basicInfo.ipsCategory': sample.ipsCategory,
    'ujat.basicInfo.partnerInvolvement': sample.partnerInvolvement,
    'ujat.basicInfo.sponsorId': sponsorId,
    'ujat.basicInfo.sponsorContactId': contactId,
    'ujat.basicInfo.sponsorContactIds': contactId ? [contactId] : [],
    'ujat.basicInfo.participant.individual': false,
    'ujat.basicInfo.participant.organization': true,
    'ujat.basicInfo.participant.teacher': false,
    'ujat.basicInfo.participant.volunteer': true,
    'ujat.basicInfo.surveyItems': { ...sample.survey },
    'ujat.kpi.participantCount': sample.kpi.participant,
    'ujat.kpi.volunteer': sample.kpi.volunteer,
    'ujat.kpi.dispatchedSchool': sample.kpi.school,
    'ujat.kpi.dispatchedClass': sample.kpi.classCount,
    [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: resolveUjatDefaultPaymentItemValues(),
    [UJAT_REGION_CAPACITY_OVERLAY_KEY]: buildUjatRegionCapacity(),
    ...buildUjatHalfSchedule('h1', sample, getUjatProgramRegistrationOverlayRecord()),
    ...buildUjatHalfSchedule('h2', sample, getUjatProgramRegistrationOverlayRecord()),
    ...buildUjatRecruitInfoOverlay(sample.recruitDates, sample.titleKo),
  }
}

const TRAINED_TEACHERS_AUTOFILL_PARTICIPANT = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
} as const

function composeTrainedTeachersRegistrationDevAutofillOverlay(input: {
  sample: DevAutofillSample
  layout: ProgramRegistrationDevAutofillLayout
  typeSettings: ProgramRegistrationDevAutofillTypeSettings
  educationScheduleLines: readonly string[]
  educationJournalEnabled: 'yes' | 'no'
  resolved: {
    sponsorId: string
    contactId: string
    detailedProgramId: string
    detailedProgramName: string
    paymentItemValues: string[]
    paymentItemLabels: string
  }
}): Record<string, unknown> {
  const basicPrefix = 'trainedTeachersRegistration.basicInfo'
  const educationScheduleLine =
    input.educationScheduleLines.find(line => line.trim()) ?? scheduleLineAt(1)
  // 교육 연수 진행 일정은 날짜만 있는 기간형 교육 일정과 달리 시간까지
  // 입력해야 한다. 기본 교육 일정의 period/date 선택값은 그대로 보존하고,
  // 교육 연수 필드에만 시간 포함 일정을 사용한다.
  const teacherTrainingScheduleLine =
    input.layout.teacherTrainingEnabled === true ? scheduleLineAt(1) : educationScheduleLine
  const participant = TRAINED_TEACHERS_AUTOFILL_PARTICIPANT
  const directScheduleEvents =
    input.typeSettings.programType === 'schedule' && input.typeSettings.sessionRoundType === 'multi'
  const overlay: Record<string, unknown> = {
    ...buildGeneralLikeOverlay(
      input.sample,
      basicPrefix,
      'generalRegistration.kpi',
      'trainedTeachersRegistration.educationCurriculum',
      'trainedTeachersRegistration.educationScheduleSettings',
      `${basicPrefix}.programTitleKo`,
      'trainedTeachersRegistration.typeSettings',
      input.layout,
      input.typeSettings,
      input.educationScheduleLines,
      input.resolved
    ),
    [`${basicPrefix}.sponsorId`]: input.resolved.sponsorId,
    [`${basicPrefix}.managerContactId`]: input.resolved.contactId,
    [`${basicPrefix}.managerContactIds`]: input.resolved.contactId
      ? [input.resolved.contactId]
      : [],
    'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled':
      input.educationJournalEnabled,
    'generalRegistration.educationCurriculum.educationJournalEnabled':
      input.educationJournalEnabled,
    ...(input.layout.teacherTrainingEnabled === true
      ? {
          'trainedTeachersRegistration.educationCurriculum.preEducationScheduleName': '교육 연수',
          'trainedTeachersRegistration.educationCurriculum.preEducationScheduleLine':
            teacherTrainingScheduleLine,
          'trainedTeachersRegistration.educationCurriculum.teacherTrainingEducationForm':
            input.typeSettings.educationForm,
          'generalRegistration.educationCurriculum.preEducationScheduleName': '교육 연수',
          'generalRegistration.educationCurriculum.preEducationScheduleLine':
            teacherTrainingScheduleLine,
        }
      : {}),
  }
  for (const key of Object.keys(overlay)) {
    if (
      key.startsWith('generalRegistration.kpi.') ||
      key.startsWith('generalRegistration.wageInfo.')
    ) {
      delete overlay[key]
    }
  }
  if (directScheduleEvents) {
    delete overlay['trainedTeachersRegistration.educationScheduleSettings.scheduleLines']
  }
  const requiredContext: TrainedTeachersRegistrationRequiredFieldContext = {
    participant,
    programType: input.typeSettings.programType,
    sessionRoundType: input.typeSettings.sessionRoundType,
    educationFormScheduleDetail: input.typeSettings.educationFormScheduleDetail,
    participationScheduleDetail: input.typeSettings.participationScheduleDetail,
    ipsScheduleDetail: input.typeSettings.ipsScheduleDetail,
    curriculumSessionCount: input.layout.curriculumSessionCount,
    curriculumChartSessionCount: input.layout.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: input.layout.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: input.layout.scheduleCurriculumGroupCount,
    teacherTrainingEnabled: input.layout.teacherTrainingEnabled === true,
    educationScheduleMode: input.typeSettings.educationScheduleMode,
    sponsorId: input.resolved.sponsorId,
    sponsorContactId: input.resolved.contactId,
    programTitleKo: input.sample.titleKo,
  }
  return completeTrainedTeachersDevAutofillOverlay(overlay, requiredContext, {
    scheduleLine: teacherTrainingScheduleLine,
    titleEn: input.sample.titleEn,
    publicTitle: input.sample.publicTitle,
    operationRange: { ...input.sample.operationRange },
    businessField: input.sample.businessField,
    educationCourse: input.sample.educationCourse,
    ipOwned: input.sample.ipOwned,
    courseDeliveredBy: input.sample.courseDeliveredBy,
    educationForm: input.typeSettings.educationForm || 'online',
    ips: { category: input.sample.ipsCategory, detail: input.sample.ipsDetail },
    unitName: input.sample.units[0]?.name || '단원',
    unitContent: input.sample.units[0]?.content || '교육 내용',
    detailedProgramId: input.resolved.detailedProgramId,
    detailedProgramName: input.resolved.detailedProgramName,
    venueDetail: input.sample.venueDetail,
  })
}

/** 테스트·개발용 — 샘플을 만들어 교육받은 교사 자동입력 overlay를 돌려준다. */
export function previewTrainedTeachersRegistrationDevAutofill(input: {
  layout: ProgramRegistrationDevAutofillLayout
  typeSettings: ProgramRegistrationDevAutofillTypeSettings
  educationJournalEnabled?: 'yes' | 'no'
  resolved: {
    sponsorId: string
    contactId: string
    detailedProgramId: string
    detailedProgramName: string
    paymentItemValues: string[]
    paymentItemLabels: string
  }
}): { overlay: Record<string, unknown>; programTitleKo: string } {
  const sample = buildTrainedTeachersDevAutofillSample()
  const educationScheduleLines = buildEducationSchedulePreviewLines(
    input.typeSettings.educationScheduleMode
  )
  return {
    programTitleKo: sample.titleKo,
    overlay: composeTrainedTeachersRegistrationDevAutofillOverlay({
      sample,
      layout: input.layout,
      typeSettings: input.typeSettings,
      educationScheduleLines,
      educationJournalEnabled: input.educationJournalEnabled ?? 'yes',
      resolved: input.resolved,
    }),
  }
}

export function previewTrainedTeachersRegistrationDevAutofillForCase(
  caseId: TrainedTeachersRegistrationDevAutofillCaseId,
  resolved: {
    sponsorId: string
    contactId: string
    detailedProgramId: string
    detailedProgramName: string
    paymentItemValues: string[]
    paymentItemLabels: string
  },
  options?: {
    teacherTrainingEnabled?: boolean
    educationJournalEnabled?: 'yes' | 'no'
  }
): {
  caseId: TrainedTeachersRegistrationDevAutofillCaseId
  layout: ProgramRegistrationDevAutofillLayout
  typeSettings: ProgramRegistrationDevAutofillTypeSettings
  participantFlags: GeneralProgramRegistrationParticipantFlags
  overlay: Record<string, unknown>
  programTitleKo: string
} {
  const preset = resolveTrainedTeachersRegistrationDevAutofillPreset(caseId)
  const layout = {
    ...preset.layout,
    teacherTrainingEnabled: options?.teacherTrainingEnabled ?? preset.layout.teacherTrainingEnabled,
  }
  const preview = previewTrainedTeachersRegistrationDevAutofill({
    layout,
    typeSettings: preset.typeSettings,
    educationJournalEnabled: options?.educationJournalEnabled ?? preset.educationJournalEnabled,
    resolved,
  })
  const overlay = {
    ...preview.overlay,
    'trainedTeachersRegistration.basicInfo.programTitleKo': preset.programTitleKo,
    'trainedTeachersRegistration.basicInfo.publicProgramTitle': preset.publicProgramTitle,
  }
  return {
    caseId,
    layout,
    typeSettings: preset.typeSettings,
    participantFlags: { ...preset.participantFlags },
    overlay,
    programTitleKo: preset.programTitleKo,
  }
}

export type ProgramRegistrationDevAutofillEditorPatch = {
  programTitleKo: string
  sponsorId: string
  sponsorContactId: string
  typeSettings?: ProgramRegistrationDevAutofillTypeSettings
  layout?: ProgramRegistrationDevAutofillLayout
  participantFlags?: GeneralProgramRegistrationParticipantFlags
}

export type ApplyDevProgramRegistrationAutofillOptions = {
  caseId?: GeneralRegistrationDevAutofillCaseId
  trainedTeachersCaseId?: TrainedTeachersRegistrationDevAutofillCaseId
  trainedTeachersTeacherTrainingEnabled?: boolean
  trainedTeachersEducationJournalEnabled?: 'yes' | 'no'
  trainedTeachersEducationScheduleMode?: 'date' | 'period'
}

const UJAT_APPLICATION_INSTITUTION_TEMPLATE_CODE = 'application-ujat-school'
const UJAT_APPLICATION_VOLUNTEER_TEMPLATE_CODE = 'application-ujat-volunteer'

/**
 * UJAT 개발용 자동입력의 신청 단계 seed.
 *
 * UJAT 신청 Form은 일반 신청 Form과 달리 학년/수업시간 블록과 봉사자 지원
 * 형태가 editorState에 있고, 나머지 입력은 templateCode별 overlay bucket에
 * 있다. 따라서 현재 탭의 store만 patch하지 않고 두 신청 탭의 scope를 모두
 * 채워 두어, 모집 → 신청 → 모집 왕복 후에도 처음 진입한 것처럼 표시한다.
 */
function seedUjatApplicationAutofill(): void {
  const region = listUjatEducationRegionsActive()[0]?.label ?? '서울'
  const gradeBlockId = 'ujat-dev-grade-1'
  const classTimeBlockId = 'ujat-dev-class-time-1'
  const classTimeStart = dayjs().startOf('day').hour(9).minute(0).toISOString()
  const classTimeEnd = dayjs().startOf('day').hour(9).minute(50).toISOString()

  const institutionOverlay = {
    [UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.applicationRegion]: region,
    [UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.gradeDetailByBlock]: {
      [gradeBlockId]: {
        classCountInput: '2',
        classNoByIndex: { 0: '1', 1: '2' },
        studentCountByIndex: { 0: '25', 1: '24' },
      },
    },
    [UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimeCheckedByBlock]: {
      [classTimeBlockId]: { '1': true },
    },
    [UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS.classTimePeriodsByBlock]: {
      [classTimeBlockId]: {
        period1: { start: classTimeStart, end: classTimeEnd },
        period2: { start: null, end: null },
        period3: { start: null, end: null },
        period4: { start: null, end: null },
      },
    },
  }
  const institutionGeneralOverlay = {
    'application.ujat.inst.basicInfo.detailAddress': '서울시 강남구 테헤란로 123',
    'application.ujat.inst.basicInfo.teacherTel': '02-1234-5678',
    'application.ujat.inst.basicInfo.teacherMobile': '010-1234-5678',
    'application.ujat.inst.basicInfo.teacherEmail': 'dev@jakorea.org',
    'application.ujat.inst.basicInfo.otherRequestsNotApplicable': false,
    'application.ujat.inst.basicInfo.otherRequests': '교구재 배송 전 담당자에게 연락해 주세요.',
  }
  replaceUjatApplicationInstitutionOverlayForScope(
    UJAT_APPLICATION_INSTITUTION_TEMPLATE_CODE,
    institutionOverlay
  )
  replaceGeneralApplicationOverlayForScope(
    UJAT_APPLICATION_INSTITUTION_TEMPLATE_CODE,
    institutionGeneralOverlay
  )

  const volunteerOverlay = {
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion]: region,
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.universityName]: '한국대학교',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.grade]: '4',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.major]: '경영학과',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.applicationRoute]: 'instagram',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.applicationRouteOther]: '',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.id1365]: 'dev1365',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm]: '1',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear]: '2025',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]: [],
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience]: 'yes',
  }
  replaceUjatApplicationVolunteerOverlayForScope(
    UJAT_APPLICATION_VOLUNTEER_TEMPLATE_CODE,
    volunteerOverlay
  )

  const institutionDraft = createSeedDraftForOperationalCatalogId(
    UJAT_APPLICATION_INSTITUTION_TEMPLATE_CODE
  )
  if (institutionDraft != null) {
    publishRegistrationWizardApplicationDraft({
      templateCode: UJAT_APPLICATION_INSTITUTION_TEMPLATE_CODE,
      draft: fillBlankApplicationFormThirdPartyRecipients(institutionDraft, 'JA코리아'),
      editorState: {
        ujatGradeApplicationBlockIds: [gradeBlockId],
        ujatApplicationGradeByBlockId: { [gradeBlockId]: '1' },
        ujatGradeClassTimeBlockIds: [classTimeBlockId],
      },
      overlay: { ...institutionOverlay, ...institutionGeneralOverlay },
    })
  }

  const volunteerDraft = createSeedDraftForOperationalCatalogId(
    UJAT_APPLICATION_VOLUNTEER_TEMPLATE_CODE
  )
  if (volunteerDraft != null) {
    publishRegistrationWizardApplicationDraft({
      templateCode: UJAT_APPLICATION_VOLUNTEER_TEMPLATE_CODE,
      draft: fillBlankApplicationFormThirdPartyRecipients(volunteerDraft, 'JA코리아'),
      editorState: { ujatVolunteerApplicationType: 'ujat-graduate' },
      overlay: volunteerOverlay,
    })
  }
}

/**
 * 프로그램 등록 공통정보 — 개발용 자동입력.
 * 셀렉트는 화면과 같은 옵션에서 고르고, 텍스트·일정은 호출마다 달라진다.
 * `layout`은 이미 추가된 커리큘럼·일정 행 수다.
 * 운영 빌드에서는 호출하지 말 것 (`import.meta.env.DEV` 가드).
 */
export async function applyDevProgramRegistrationAutofill(
  variant: ProgramRegistrationFormVariant | 'ujat',
  layout: ProgramRegistrationDevAutofillLayout = DEFAULT_AUTOFILL_LAYOUT,
  options?: ApplyDevProgramRegistrationAutofillOptions
): Promise<ProgramRegistrationDevAutofillEditorPatch> {
  const generalCasePreset =
    variant === 'general' && options?.caseId != null
      ? resolveGeneralRegistrationDevAutofillPreset(options.caseId)
      : null
  const trainedTeachersCasePreset =
    variant === 'trainedTeachers' && options?.trainedTeachersCaseId != null
      ? resolveTrainedTeachersRegistrationDevAutofillPreset(options.trainedTeachersCaseId)
      : null
  const effectiveLayout =
    generalCasePreset != null
      ? {
          ...generalCasePreset.layout,
          participant: mergeGeneralDevAutofillParticipant(
            generalCasePreset.participantFlags,
            layout.participant
          ),
        }
      : trainedTeachersCasePreset != null
        ? {
            ...trainedTeachersCasePreset.layout,
            teacherTrainingEnabled:
              options?.trainedTeachersTeacherTrainingEnabled ??
              trainedTeachersCasePreset.layout.teacherTrainingEnabled,
            participant: { ...trainedTeachersCasePreset.participantFlags },
          }
        : layout
  const overlayBehavior = generalCasePreset?.overlayBehavior

  const sample =
    variant === 'trainedTeachers'
      ? buildTrainedTeachersDevAutofillSample()
      : buildDevAutofillSample()
  if (generalCasePreset != null) {
    sample.titleKo = generalCasePreset.programTitleKo
    sample.publicTitle = generalCasePreset.publicProgramTitle
    sample.ipsCategory = DEV_AUTOFILL_FIXED_IPS.category
    sample.ipsDetail = DEV_AUTOFILL_FIXED_IPS.detail
  } else if (trainedTeachersCasePreset != null) {
    sample.titleKo = trainedTeachersCasePreset.programTitleKo
    sample.publicTitle = trainedTeachersCasePreset.publicProgramTitle
  }
  const economyPhrases =
    variant === 'economy' ? selectEconomyRegistrationAutofillPhrases() : undefined
  if (economyPhrases) {
    const dates = buildEconomyAutofillDatePlan()
    sample.titleKo = economyPhrases.program.titleKo
    sample.titleEn = economyPhrases.program.titleEn
    sample.publicTitle = economyPhrases.program.publicTitle
    sample.units = [...economyPhrases.units]
    sample.businessField = 'economy_finance'
    sample.recruitDates = dates
    sample.operationRange = { ...dates.business }
    sample.periodRange = { ...dates.educationPeriod }
  }
  if (variant === 'ujat') {
    sample.recruitDates = alignUjatAutofillDatePlan(sample.recruitDates)
    sample.operationRange = { ...sample.recruitDates.business }
    sample.periodRange = { ...sample.recruitDates.business }
  }
  patchRecruitDatePlan(sample.recruitDates, sample.titleKo, {
    variant,
    participant: effectiveLayout.participant,
    economy: economyPhrases,
  })
  const typeSettings =
    generalCasePreset?.typeSettings ??
    trainedTeachersCasePreset?.typeSettings ??
    finalizeTypeSettings(variant, effectiveLayout, options?.trainedTeachersEducationScheduleMode)
  const educationJournalEnabled =
    options?.trainedTeachersEducationJournalEnabled ??
    trainedTeachersCasePreset?.educationJournalEnabled ??
    'yes'
  const scheduleLineCount =
    generalCasePreset != null || trainedTeachersCasePreset != null
      ? typeSettings.sessionRoundType === 'multi'
        ? 2
        : 1
      : undefined
  const educationScheduleLines = buildEducationSchedulePreviewLines(
    typeSettings.educationScheduleMode,
    scheduleLineCount
  )

  if (variant === 'ujat') {
    const resolved = await resolveSponsorAndContact(true)
    const contactSelectId = toSponsorContactSelectValue(
      resolved.sponsorId,
      resolved.contactId,
      false
    )
    const ujatOverlay = stripUjatKpiWageCapacityOverlay(
      buildUjatOverlay(sample, { ...resolved, contactId: contactSelectId })
    )
    patchUjatProgramRegistrationOverlay(ujatOverlay)
    const interviewUnavailable = buildInterviewUnavailableSelection(
      dayjs(sample.recruitDates.interview.start),
      dayjs(sample.recruitDates.interview.end)
    )
    const interviewClockStart = dayjs().startOf('day').hour(10).minute(0).second(0).millisecond(0)
    const interviewClockEnd = interviewClockStart.hour(12)
    const firstSlotEnd = interviewClockStart.add(30, 'minute')
    applyDevAutofillRecruitOverlayPartials('ujat', undefined, {
      ujatInstitution: pickUjatRecruitInstitutionOverlay(ujatOverlay),
      ujatVolunteer: pickUjatRecruitVolunteerOverlay(ujatOverlay),
      general: {
        ...recruitDetailPatch(
          'ujatRecruit.detailInfo',
          ['programDescription', 'recruitmentGuide', 'applicationMethod', 'learningSupportContent'],
          sample.titleKo
        ),
        ...(['h1', 'h2'] as const).reduce(
          (acc, half) => {
            const interviewNs = ujatVolunteerRecruitInterviewNamespace(half)
            const detailPrefix = ujatVolunteerRecruitDetailInfoPrefix(half)
            return {
              ...acc,
              [ujatVolunteerRecruitInterviewRangeSealKey(half)]: {
                ...sample.recruitDates.interview,
              },
              [`${interviewNs}.timeUnit`]: '30',
              [`${interviewNs}.interviewTimeRange`]: [
                interviewClockStart.toISOString(),
                interviewClockEnd.toISOString(),
              ],
              [`${interviewNs}.interviewTime`]: interviewClockStart.toISOString(),
              [`${interviewNs}.selectedSlotKeys`]: [
                `${interviewClockStart.valueOf()}-${firstSlotEnd.valueOf()}`,
              ],
              [`${interviewNs}.exclusionState`]: interviewUnavailable.exclusion,
              [`${interviewNs}.appliedUnavailableDates`]: interviewUnavailable.dates,
              ...recruitDetailPatch(
                detailPrefix,
                ['programDescription', 'recruitmentGuide', 'applicationMethod', 'otherNotes'],
                `${sample.titleKo} ${half === 'h1' ? '상반기' : '하반기'}`
              ),
            }
          },
          {} as Record<string, unknown>
        ),
      },
    })
    seedUjatApplicationAutofill()
    return {
      programTitleKo: sample.titleKo,
      sponsorId: resolved.sponsorId,
      sponsorContactId: contactSelectId,
    }
  }

  seedDevAutofillApplicationThirdPartyRecipients(variant, effectiveLayout)

  if (variant === 'economy') {
    const [sponsorContact, detailedProgram, paymentItems] = await Promise.all([
      resolveSponsorAndContact(true),
      // 1사1교는 항상 커리큘럼형 → 「해당없음」 불가, 카탈로그의 대표 프로그램 우선
      resolveDetailedProgram({
        includeNone: false,
        preferLabel: ECONOMY_DETAILED_PROGRAM_MAIN_LABEL,
      }),
      pickPaymentItemSelection(),
    ])
    const contactSelectId = toSponsorContactSelectValue(
      sponsorContact.sponsorId,
      sponsorContact.contactId,
      false
    )
    patchProgramRegistrationOverlay({
      ...buildEconomyOverlay(sample, {
        ...sponsorContact,
        contactId: contactSelectId,
        detailedProgramId: detailedProgram.id,
        detailedProgramName: detailedProgram.name,
        paymentItemValues: paymentItems.ids,
      }),
      'generalRegistration.typeSettings.ipsType': {
        category: sample.ipsCategory,
        detail: sample.ipsDetail,
      },
      'generalRegistration.typeSettings.singleEducationForm': typeSettings.educationForm,
      'generalRegistration.typeSettings.multiCommonEducationForm': typeSettings.educationForm,
      'generalRegistration.typeSettings.singleParticipation': typeSettings.participation,
      'generalRegistration.typeSettings.multiCommonParticipation': typeSettings.participation,
    })
    return {
      programTitleKo: sample.titleKo,
      sponsorId: sponsorContact.sponsorId || ECONOMY_ALL_VALUE,
      sponsorContactId: contactSelectId || ECONOMY_ALL_VALUE,
      typeSettings,
    }
  }

  const [sponsorContact, detailedProgram, paymentItems] = await Promise.all([
    resolveSponsorAndContact(false),
    // 「해당없음」은 일반 일정형에서만 유효. 교육받은 교사는 카탈로그의 대표 프로그램 우선.
    resolveDetailedProgram(
      variant === 'trainedTeachers'
        ? { includeNone: false, preferLabel: ECONOMY_DETAILED_PROGRAM_MAIN_LABEL }
        : { includeNone: typeSettings.programType === 'schedule' }
    ),
    variant === 'trainedTeachers'
      ? Promise.resolve({ ids: [], labels: '' })
      : pickPaymentItemSelection(),
  ])
  const sponsorId = String(sponsorContact.sponsorId || '').trim()
  const resolved = {
    sponsorId,
    contactId: toSponsorContactSelectValue(sponsorId, sponsorContact.contactId, true),
    detailedProgramId: detailedProgram.id,
    detailedProgramName: detailedProgram.name,
    paymentItemValues: paymentItems.ids,
    paymentItemLabels: paymentItems.labels,
  }

  if (variant === 'trainedTeachers') {
    const trainedTeachersOverlay = composeTrainedTeachersRegistrationDevAutofillOverlay({
      sample,
      layout: effectiveLayout,
      typeSettings,
      educationScheduleLines,
      educationJournalEnabled,
      resolved,
    })
    replaceProgramRegistrationOverlayPrefixes(
      [
        'trainedTeachersRegistration.basicInfo',
        'trainedTeachersRegistration.typeSettings',
        'trainedTeachersRegistration.educationCurriculum',
        'trainedTeachersRegistration.educationScheduleSettings',
        'generalRegistration.basicInfo',
        'generalRegistration.typeSettings',
        'generalRegistration.educationCurriculum',
        'generalRegistration.educationScheduleSettings',
        'generalRegistration.educationScheduleCurriculum',
        'generalRegistration.kpi',
        'generalRegistration.wageInfo',
      ],
      trainedTeachersOverlay
    )
    return {
      programTitleKo: sample.titleKo,
      sponsorId: resolved.sponsorId,
      sponsorContactId: resolved.contactId,
      participantFlags: { ...TRAINED_TEACHERS_AUTOFILL_PARTICIPANT },
      typeSettings,
      layout: effectiveLayout,
    }
  }

  patchProgramRegistrationOverlay(
    buildGeneralLikeOverlay(
      sample,
      'generalRegistration.basicInfo',
      'generalRegistration.kpi',
      'generalRegistration.educationCurriculum',
      'generalRegistration.educationScheduleSettings',
      GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
      'generalRegistration.typeSettings',
      effectiveLayout,
      typeSettings,
      educationScheduleLines,
      resolved,
      overlayBehavior
    )
  )
  patchGeneralRegistrationSponsorSelectionOverlay({
    sponsorId: resolved.sponsorId,
    contactSelectValue: resolved.contactId,
  })
  if (resolved.detailedProgramId) {
    patchProgramRegistrationOverlay({
      'generalRegistration.basicInfo.detailedProgramId': resolved.detailedProgramId,
      'generalRegistration.basicInfo.detailedProgramName': resolved.detailedProgramName,
    })
  }
  return {
    programTitleKo: sample.titleKo,
    sponsorId: resolved.sponsorId,
    sponsorContactId: resolved.contactId,
    typeSettings,
    layout: effectiveLayout,
    participantFlags: effectiveLayout.participant ?? generalCasePreset?.participantFlags,
  }
}

export type PreviewGeneralRegistrationDevAutofillForCaseResult = {
  typeSettings: ProgramRegistrationDevAutofillTypeSettings
  layout: ProgramRegistrationDevAutofillLayout
  participantFlags: GeneralProgramRegistrationParticipantFlags
  programTitleKo: string
}

/** 테스트·검증용 — API 없이 overlay·모집·신청 시드를 케이스 프리셋으로 채운다. */
export function previewGeneralRegistrationDevAutofillForCase(
  caseId: GeneralRegistrationDevAutofillCaseId,
  resolved: {
    sponsorId: string
    contactId: string
    detailedProgramId: string
    detailedProgramName: string
    paymentItemValues: string[]
    paymentItemLabels: string
  }
): PreviewGeneralRegistrationDevAutofillForCaseResult {
  const preset = resolveGeneralRegistrationDevAutofillPreset(caseId)
  const sample = buildDevAutofillSample()
  sample.titleKo = preset.programTitleKo
  sample.publicTitle = preset.publicProgramTitle
  sample.ipsCategory = DEV_AUTOFILL_FIXED_IPS.category
  sample.ipsDetail = DEV_AUTOFILL_FIXED_IPS.detail
  patchRecruitDatePlan(sample.recruitDates, sample.titleKo, {
    variant: 'general',
    participant: preset.participantFlags,
  })
  const typeSettings = preset.typeSettings
  const educationScheduleLines = buildEducationSchedulePreviewLines(
    typeSettings.educationScheduleMode,
    typeSettings.sessionRoundType === 'multi' ? 2 : 1
  )
  seedDevAutofillApplicationThirdPartyRecipients('general', preset.layout)
  patchProgramRegistrationOverlay(
    buildGeneralLikeOverlay(
      sample,
      'generalRegistration.basicInfo',
      'generalRegistration.kpi',
      'generalRegistration.educationCurriculum',
      'generalRegistration.educationScheduleSettings',
      GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
      'generalRegistration.typeSettings',
      preset.layout,
      typeSettings,
      educationScheduleLines,
      {
        ...resolved,
        contactId: resolved.contactId,
      },
      preset.overlayBehavior
    )
  )
  return {
    typeSettings,
    layout: preset.layout,
    participantFlags: preset.participantFlags,
    programTitleKo: sample.titleKo,
  }
}
