import dayjs, { type Dayjs } from 'dayjs'
import { shouldDisableEducationSchedulePeriodMode } from '@/features/program/general/lib/schedule-detail-form'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  patchApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { patchGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { getDetailedProgramOptionsList } from '@/features/detailed-program/api/admin-detailed-programs-service'
import {
  getSponsorContacts,
  getSponsorOptionsList,
  shouldUseSponsorsRemoteApi,
} from '@/features/sponsor/api/admin-sponsors-service'
import {
  UJAT_DETAILED_PROGRAM_UJAT_VALUE,
  UJAT_SPONSOR_ALL_VALUE,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
  TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import { getTemplateRegistrationPaymentItemOptions } from '@/features/template/lib/template-registration-payment-item-options'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  patchProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { patchUjatProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  ujatHalfScheduleOverlayKeys,
  type UjatEducationDelivery,
  type UjatHalfSemesterKey,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { encodeSponsorManagerContactRef } from '@/features/program/general/model/common-info-edit-schema'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import {
  INSTRUCTOR_TARGET_OPTIONS,
  INTERVIEW_METHOD_OPTIONS,
  VOLUNTEER_TARGET_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { createDefaultUnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'

const VENUE_KINDS = ['inside', 'outside', 'other'] as const
const EDUCATION_DELIVERIES = ['online', 'offline', 'hybrid'] as const satisfies readonly UjatEducationDelivery[]

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
  const interviewStart = recruitStart.add(
    recruitDays <= 1 ? 0 : pickInt(0, recruitDays - 1),
    'day'
  )
  const interviewRemain = Math.max(0, recruitEnd.diff(interviewStart, 'day'))
  const interviewEnd = interviewStart.add(interviewRemain === 0 ? 0 : pickInt(0, interviewRemain), 'day')

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
  성인: '경제 교육 경력 강사',
  대학생: '관련 학과 재학생',
  기타: '지역 봉사 강사',
}
const VOLUNTEER_TARGET_DETAIL: Record<string, string> = {
  '대학(원)생': '경제·교육 관련 학과 재학생',
  일반인: '평일 오후 참여 가능한 성인',
  기타: '지역 봉사 경험자',
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
  titleKo: string
): Record<string, unknown> {
  const copy: Record<string, string> = {
    programDescription: `${titleKo}는 학교 현장에서 경제·금융 기초를 익히는 참여형 교육입니다.`,
    recruitmentGuide: '신청서 제출 후 담당자 확인을 거쳐 참여 학교를 확정합니다.',
    applicationMethod: '온라인 신청서 작성 후 제출해 주세요. 추가 서류는 담당자가 안내합니다.',
    learningSupportContent: '교재와 활동지를 제공하고, 수업 전 강사 사전 연수를 진행합니다.',
    otherNotes: '우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.',
  }
  const patch: Record<string, unknown> = {
    [`${prefix}.thumbFileName`]: null,
    [`${prefix}.attachmentFileNames`]: ['모집안내.pdf'],
    [`${prefix}.additionalContentHtml`]: `<p>${titleKo} 참여를 희망하는 학교와 강사는 모집 기간 안에 신청해 주세요.</p>`,
  }
  for (const field of fields) {
    patch[`${prefix}.${field}`] = copy[field] ?? ''
  }
  return patch
}

function patchRecruitDatePlan(
  plan: ReturnType<typeof buildRegistrationDatePlan>,
  titleKo: string
): void {
  const programSeal = { ...plan.program }
  const recruitSeal = { ...plan.recruit }
  const interviewSeal = { ...plan.interview }
  const institutionKeys = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
  const educationTargets = pickSome(EDUCATION_TARGET_OPTIONS, pickInt(1, 2))
  const instructorTargets = pickSome(INSTRUCTOR_TARGET_OPTIONS, pickInt(1, 2))
  const volunteerTargets = pickSome(VOLUNTEER_TARGET_OPTIONS, pickInt(1, 2))
  const interviewClockStart = dayjs().startOf('day').hour(10).minute(0).second(0).millisecond(0)
  const interviewClockEnd = interviewClockStart.hour(12)
  const firstSlotEnd = interviewClockStart.add(30, 'minute')
  const institutionInquiry = recruitInquiryPatch('recruit')

  patchApplicantRecruitInstitutionOverlay({
    [institutionKeys.announcementPublished]: 'published',
    [institutionKeys.studentListRequired]: pick(['need', 'none']),
    [institutionKeys.preguidanceRequired]: pick(['need', 'none']),
    [institutionKeys.maxAssignableInstructors]: pickInt(1, 4),
    [institutionKeys.maxClassCount]: pickInt(2, 6),
    [institutionKeys.maxScheduleCount]: pickInt(1, 4),
    [institutionKeys.maxSessionsPerDay]: pickInt(2, 6),
    [institutionKeys.programRangeSeal]: programSeal,
    [institutionKeys.programAnchorIso]: programSeal.start,
    [institutionKeys.recruitRangeSeal]: recruitSeal,
    [institutionKeys.recruitAnchorIso]: recruitSeal.start,
    [institutionKeys.targetLevels]: educationTargets.map(option => option.value),
    [institutionKeys.targetLevelDetail]: educationTargets
      .map(option => EDUCATION_TARGET_DETAIL[option.value] ?? option.label)
      .join(', '),
    [institutionKeys.finalAnnounceIso]: recruitSeal.end,
    [institutionKeys.finalAnnounceMethod]: institutionInquiry['recruit.finalAnnounceMethod'],
    [institutionKeys.inquiryContact]: institutionInquiry['recruit.inquiryContact'],
    [institutionKeys.inquiryTel]: institutionInquiry['recruit.inquiryTel'],
    [institutionKeys.inquiryEmail]: institutionInquiry['recruit.inquiryEmail'],
    [institutionKeys.notesNotApplicable]: false,
    [institutionKeys.notes]: institutionInquiry['recruit.notes'],
  })

  const individualInquiry = recruitInquiryPatch('recruit.individual')
  const instructorInquiry = recruitInquiryPatch('recruit.instructor')
  const volunteerInquiry = recruitInquiryPatch('recruit.volunteer')
  patchGeneralRecruitOverlay({
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
    'recruit.individual.targetLevelDetail': educationTargets
      .map(option => EDUCATION_TARGET_DETAIL[option.value] ?? option.label)
      .join(', '),
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
    ...recruitDetailPatch('recruit.detailInfo', [
      'programDescription',
      'recruitmentGuide',
      'applicationMethod',
      'learningSupportContent',
    ], titleKo),
    ...recruitDetailPatch('economyRecruit.detailInfo', [
      'programDescription',
      'recruitmentGuide',
      'applicationMethod',
      'learningSupportContent',
    ], titleKo),
    ...recruitDetailPatch('trainedTeachersRecruit.detailInfo', [
      'programDescription',
      'recruitmentGuide',
      'applicationMethod',
      'learningSupportContent',
    ], titleKo),
    ...recruitDetailPatch('ujatRecruit.detailInfo', [
      'programDescription',
      'recruitmentGuide',
      'applicationMethod',
      'learningSupportContent',
    ], titleKo),
    ...recruitDetailPatch('recruitInstructor.detailInfo', [
      'programDescription',
      'recruitmentGuide',
      'applicationMethod',
      'otherNotes',
    ], titleKo),
    ...recruitDetailPatch('recruitVolunteer.detailInfo', [
      'programDescription',
      'recruitmentGuide',
      'applicationMethod',
      'otherNotes',
    ], titleKo),
  })
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
      end: periodEnd.isAfter(dayjs(dates.business.end))
        ? dates.business.end
        : dayIso(periodEnd),
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

/** 1사1교 폼에 고정으로 노출되는 「전체」 옵션 값 */
const ECONOMY_ALL_VALUE = '__all__' as const
const ECONOMY_DETAILED_PROGRAM_MAIN_VALUE = '__economy_1c1s_main__' as const

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
    const sponsor = sponsors.length > 0 ? pick(sponsors) : undefined
    if (!sponsor?.id) return empty
    const contacts = await getSponsorContacts(sponsor.id)
    const contact = contacts.length > 0 ? pick(contacts) : undefined
    return { sponsorId: sponsor.id, contactId: contact?.id ?? '' }
  } catch {
    return empty
  }
}

async function resolveDetailedProgramId(extraValues: readonly string[] = []): Promise<string> {
  const pool = [...extraValues]
  try {
    const rows = await getDetailedProgramOptionsList()
    for (const row of rows) {
      if (row.id) pool.push(row.id)
    }
  } catch {
    /* remote 미연동·실패 시 고정 옵션만 */
  }
  if (!pool.includes(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)) {
    pool.push(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
  }
  return pick(pool)
}

function pickPaymentItemValues(): string[] {
  const options = getTemplateRegistrationPaymentItemOptions()
  if (options.length === 0) return []
  const count = Math.min(options.length, pickInt(1, 2))
  const shuffled = [...options].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(option => option.value)
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
  return {
    programType: variant === 'economy' ? 'curriculum' : pick(['curriculum', 'schedule']),
    sessionRoundType: pick(['single', 'multi']),
    educationFormScheduleDetail: pick(SCHEDULE_DETAIL_KINDS),
    participationScheduleDetail: pick(SCHEDULE_DETAIL_KINDS),
    ipsScheduleDetail: pick(SCHEDULE_DETAIL_KINDS),
    educationForm: pick(EDUCATION_FORM_VALUES),
    participation: pick(PARTICIPATION_VALUES),
  }
}

function periodScheduleLine(index: number): string {
  const start = upcomingWeekday(18 + (index - 1) * 14)
  let end = start.add(pickInt(4, 16), 'day')
  while (end.day() === 0 || end.day() === 6) end = end.add(1, 'day')
  return formatEducationScheduleLineFromRange([start.startOf('day'), end.startOf('day')])
}

function buildEducationSchedulePreviewLines(mode: 'date' | 'period'): string[] {
  const count = pickInt(1, 5)
  return Array.from({ length: count }, (_, index) =>
    mode === 'period' ? periodScheduleLine(index + 1) : scheduleLineAt(index + 1)
  )
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
  layout: ProgramRegistrationDevAutofillLayout
): ProgramRegistrationDevAutofillTypeSettings {
  const drafted = buildTypeSettings(variant)
  const keepVisibleRows =
    (layout.programType === 'schedule' && layout.scheduleCurriculumDetailCount > 1) ||
    (layout.programType !== 'schedule' &&
      ((layout.sessionRoundType === 'multi' && layout.curriculumSessionCount > 1) ||
        (layout.sessionRoundType !== 'multi' && layout.curriculumChartSessionCount > 1)))
  const programType =
    variant === 'economy' || keepVisibleRows
      ? variant === 'economy'
        ? 'curriculum'
        : layout.programType
      : drafted.programType
  const sessionRoundType = keepVisibleRows ? layout.sessionRoundType : drafted.sessionRoundType
  const educationScheduleMode =
    variant === 'economy'
      ? 'period'
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
    paymentItemValues: string[]
  }
): Record<string, unknown> {
  const detailCount = rowCount(layout.scheduleCurriculumDetailCount)
  const groupCount = rowCount(layout.scheduleCurriculumGroupCount)
  const chartCount = rowCount(layout.curriculumChartSessionCount)
  const roundCount = rowCount(layout.curriculumSessionCount)
  const sessionSpan = Math.max(chartCount, roundCount)
  const educationFormByIndex = (count: number) =>
    indexRecord(count, () => pick(EDUCATION_FORM_VALUES))
  const participationByIndex = (count: number) =>
    indexRecord(count, () => pick(PARTICIPATION_VALUES))
  return {
    [`${basicPrefix}.programTitleEn`]: sample.titleEn,
    [`${basicPrefix}.publicProgramTitle`]: sample.publicTitle,
    [`${basicPrefix}.detailedProgramId`]: resolved.detailedProgramId,
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
    [`${typeSettingsPrefix}.ipsType`]: {
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
    'generalRegistration.educationCurriculum.ipsBySession': indexRecord(sessionSpan, () => randomIps()),
    'generalRegistration.educationCurriculum.progressSessionByRound': indexRecord(roundCount, index =>
      String(((index - 1) % 16) + 1)
    ),
    'generalRegistration.educationCurriculum.roundContentByRound': indexRecord(roundCount, index =>
      unitText(sample, index, 'content')
    ),
    'generalRegistration.educationCurriculum.assignmentByRound': indexRecord(roundCount, index => ({
      enabled: true,
      period: scheduleLineAt(index),
    })),
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
      () => randomIps()
    ),
    'generalRegistration.educationScheduleCurriculum.assignmentByDetail': indexRecord(
      detailCount,
      index => ({
        enabled: true,
        period: scheduleLineAt(index),
      })
    ),
    'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': indexRecord(
      detailCount,
      index =>
        Array.from({ length: groupCount }, (_, groupIndex) => ({
          ...GROUP_TIME_SLOTS[(index + groupIndex) % GROUP_TIME_SLOTS.length],
        }))
    ),
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
  resolved: { sponsorId: string; contactId: string; detailedProgramId: string }
): Record<string, unknown> {
  const p = 'economyRegistration.basicInfo'
  const sponsorId = resolved.sponsorId || ECONOMY_ALL_VALUE
  const contactId = resolved.contactId || (sponsorId === ECONOMY_ALL_VALUE ? ECONOMY_ALL_VALUE : '')
  return {
    [`${p}.repKo`]: sample.titleKo,
    [`${p}.repEn`]: sample.titleEn,
    [`${p}.publicProgramTitle`]: sample.publicTitle,
    [`${p}.detailedProgramId`]: resolved.detailedProgramId,
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
  }
}

function buildUjatHalfSchedule(
  half: UjatHalfSemesterKey,
  sample: DevAutofillSample
): Record<string, unknown> {
  const keys = ujatHalfScheduleOverlayKeys(half)
  const regionKey = pick(listUjatEducationRegionsActive()).key
  const delivery = pick(EDUCATION_DELIVERIES)
  const shiftWeeks = half === 'h2' ? 20 : 0
  const preDate = dayjs(sample.periodRange.start).add(shiftWeeks, 'week').toISOString()
  const closingDate = dayjs(sample.periodRange.end).add(shiftWeeks, 'week').toISOString()
  const eventStart = dayjs(sample.periodRange.start).add(shiftWeeks, 'week').toISOString()
  const eventEnd = dayjs(sample.periodRange.end).add(shiftWeeks, 'week').toISOString()
  const multi = (date: string) => ({
    rowIds: [0],
    regionByRow: { '0': [regionKey] },
    dateByRow: { '0': date },
  })
  return {
    [keys.preName]: half === 'h1' ? '상반기 발대식' : '하반기 발대식',
    [keys.preDelivery]: delivery,
    [keys.preTextbookMode]: 'ja',
    [keys.preMulti]: multi(preDate),
    [keys.eventName]: sample.eventNames[half === 'h1' ? 0 : 1],
    [keys.eventRange]: { start: eventStart, end: eventEnd },
    [keys.eventDelivery]: delivery,
    [keys.closingName]: half === 'h1' ? '상반기 해단식' : '하반기 해단식',
    [keys.closingDelivery]: pick(EDUCATION_DELIVERIES),
    [keys.closingMulti]: multi(closingDate),
  }
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
    'ujat.basicInfo.publicProgramTitle': sample.publicTitle,
    'ujat.basicInfo.programManagementName': `${sample.titleKo} 운영`,
    'ujat.basicInfo.detailedProgramId': UJAT_DETAILED_PROGRAM_UJAT_VALUE,
    'ujat.basicInfo.operationRangeSeal': { ...sample.operationRange },
    'ujat.basicInfo.businessField': sample.businessField,
    'ujat.basicInfo.educationCourse': sample.educationCourse,
    'ujat.basicInfo.ipOwned': sample.ipOwned,
    'ujat.basicInfo.courseDeliveredBy': sample.courseDeliveredBy,
    'ujat.basicInfo.ipsCategory': sample.ipsCategory,
    'ujat.basicInfo.partnerInvolvement': sample.partnerInvolvement,
    'ujat.basicInfo.sponsorId': sponsorId,
    'ujat.basicInfo.sponsorContactId': contactId,
    'ujat.basicInfo.sponsorContactIds': contactId ? [contactId] : [],
    'ujat.basicInfo.participant.organization': true,
    'ujat.basicInfo.participant.volunteer': true,
    'ujat.basicInfo.surveyItems': { ...sample.survey },
    'ujat.kpi.participantCount': sample.kpi.participant,
    'ujat.kpi.volunteer': sample.kpi.volunteer,
    'ujat.kpi.dispatchedSchool': sample.kpi.school,
    'ujat.kpi.dispatchedClass': sample.kpi.classCount,
    ...buildUjatHalfSchedule('h1', sample),
    ...buildUjatHalfSchedule('h2', sample),
  }
}

export type ProgramRegistrationDevAutofillEditorPatch = {
  programTitleKo: string
  sponsorId: string
  sponsorContactId: string
  typeSettings?: ProgramRegistrationDevAutofillTypeSettings
}

/**
 * 프로그램 등록 공통정보 — 개발용 자동입력.
 * 셀렉트는 화면과 같은 옵션에서 고르고, 텍스트·일정은 호출마다 달라진다.
 * `layout`은 이미 추가된 커리큘럼·일정 행 수다.
 * 운영 빌드에서는 호출하지 말 것 (`import.meta.env.DEV` 가드).
 */
export async function applyDevProgramRegistrationAutofill(
  variant: ProgramRegistrationFormVariant | 'ujat',
  layout: ProgramRegistrationDevAutofillLayout = DEFAULT_AUTOFILL_LAYOUT
): Promise<ProgramRegistrationDevAutofillEditorPatch> {
  const sample = buildDevAutofillSample()
  patchRecruitDatePlan(sample.recruitDates, sample.titleKo)
  const typeSettings = finalizeTypeSettings(variant, layout)
  const educationScheduleLines = buildEducationSchedulePreviewLines(
    typeSettings.educationScheduleMode
  )

  if (variant === 'ujat') {
    const resolved = await resolveSponsorAndContact(true)
    const contactSelectId = toSponsorContactSelectValue(
      resolved.sponsorId,
      resolved.contactId,
      false
    )
    patchUjatProgramRegistrationOverlay(
      buildUjatOverlay(sample, { ...resolved, contactId: contactSelectId })
    )
    return {
      programTitleKo: sample.titleKo,
      sponsorId: resolved.sponsorId,
      sponsorContactId: contactSelectId,
    }
  }

  if (variant === 'economy') {
    const [sponsorContact, detailedProgramId] = await Promise.all([
      resolveSponsorAndContact(true),
      resolveDetailedProgramId([ECONOMY_DETAILED_PROGRAM_MAIN_VALUE]),
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
        detailedProgramId,
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

  const [sponsorContact, detailedProgramId] = await Promise.all([
    resolveSponsorAndContact(false),
    resolveDetailedProgramId(
      variant === 'trainedTeachers' ? [ECONOMY_DETAILED_PROGRAM_MAIN_VALUE] : []
    ),
  ])
  const resolved = {
    ...sponsorContact,
    contactId: toSponsorContactSelectValue(sponsorContact.sponsorId, sponsorContact.contactId, true),
    detailedProgramId,
    paymentItemValues: pickPaymentItemValues(),
  }

  if (variant === 'trainedTeachers') {
    const basicPrefix = 'trainedTeachersRegistration.basicInfo'
    patchProgramRegistrationOverlay({
      ...buildGeneralLikeOverlay(
        sample,
        basicPrefix,
        'generalRegistration.kpi',
        'trainedTeachersRegistration.educationCurriculum',
        'trainedTeachersRegistration.educationScheduleSettings',
        `${basicPrefix}.programTitleKo`,
        'trainedTeachersRegistration.typeSettings',
        layout,
        typeSettings,
        educationScheduleLines,
        resolved
      ),
      [`${basicPrefix}.sponsorId`]: resolved.sponsorId,
      [`${basicPrefix}.managerContactId`]: resolved.contactId,
      [`${basicPrefix}.managerContactIds`]: resolved.contactId ? [resolved.contactId] : [],
    })
    return {
      programTitleKo: sample.titleKo,
      sponsorId: resolved.sponsorId,
      sponsorContactId: resolved.contactId,
      typeSettings,
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
      layout,
      typeSettings,
      educationScheduleLines,
      resolved
    )
  )
  return {
    programTitleKo: sample.titleKo,
    sponsorId: resolved.sponsorId,
    sponsorContactId: resolved.contactId,
    typeSettings,
  }
}
