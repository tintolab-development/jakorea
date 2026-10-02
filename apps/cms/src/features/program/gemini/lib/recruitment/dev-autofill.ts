/**
 * Gemini 찾아가는 연수 모집 공고 — 개발용 자동입력.
 * 호출마다 비고·교육 대상·교육 형태·게시·기간·섹션 설명 케이스를 하나씩 고른다.
 * 대상은 성인·대학생, 교육 형태는 온라인·오프라인, 신청 주체는 기관이다.
 * 기관 모집 기간·연수 요청 가능기간은 해당 연도 10월 안에 두고,
 * 연수 요청 시작일은 목록 기본 필터(올해 1월 1일~접속일)와 겹치게 잡는다.
 * 첨부·썸네일은 파일 업로드라 채우지 않는다.
 * 운영 빌드에서는 호출하지 말 것 (`import.meta.env.DEV` 가드).
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiRecruitmentAddFormSnapshot } from './add-local-save'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from './add-local-save'

/** 노션 등록 폼 기본값 */
const GEMINI_DEV_MIN_STUDENT_COUNT = 15

export type GeminiRecruitmentDevAutofillCase = {
  notes: 'not-applicable' | 'filled'
  educationTarget: 'adult' | 'university' | 'both'
  educationForm: 'online' | 'offline'
  announcement: 'published' | 'unpublished'
  /** 연수 요청이 모집 종료 다음 날부터인지, 모집 기간과 겹치는지 */
  period: 'request-after-recruitment' | 'request-overlaps-recruitment'
  /** 공란이면 홈페이지 모집 상세에서 항목이 숨겨진다 */
  sectionDescription: 'shown' | 'hidden'
}

const NOTES_CASES = ['not-applicable', 'filled'] as const
const TARGET_CASES = ['adult', 'university', 'both'] as const
const FORM_CASES = ['online', 'offline'] as const
const ANNOUNCEMENT_CASES = ['published', 'unpublished'] as const
const PERIOD_CASES = ['request-after-recruitment', 'request-overlaps-recruitment'] as const
const DESCRIPTION_CASES = ['shown', 'hidden'] as const

function titles(year: number): readonly string[] {
  return [
    `${year} 찾아가는 연수 참여 기관 모집`,
    `${year} 성인 찾아가는 경제금융 연수`,
    `${year} 대학생 찾아가는 금융이해력 연수`,
    `${year} 기관 방문 경제교육 연수`,
  ]
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function toIso(date: Dayjs): string {
  return date.startOf('day').toISOString()
}

function isWeekend(date: Dayjs): boolean {
  return date.day() === 0 || date.day() === 6
}

function weekdayOnOrBefore(date: Dayjs, min: Dayjs): Dayjs {
  let cursor = date.startOf('day')
  if (cursor.isBefore(min, 'day')) cursor = min.startOf('day')
  while (isWeekend(cursor) && cursor.isAfter(min, 'day')) {
    cursor = cursor.subtract(1, 'day')
  }
  return cursor
}

function weekdayOnOrAfter(date: Dayjs, max: Dayjs): Dayjs {
  let cursor = date.startOf('day')
  if (cursor.isAfter(max, 'day')) cursor = max.startOf('day')
  while (isWeekend(cursor) && cursor.isBefore(max, 'day')) {
    cursor = cursor.add(1, 'day')
  }
  return cursor
}

function educationTargets(
  target: GeminiRecruitmentDevAutofillCase['educationTarget']
): { levels: string[]; detail: string } {
  if (target === 'adult') {
    return { levels: ['adult'], detail: '평생학습관·복지관 등 성인 학습 기관' }
  }
  if (target === 'university') {
    return { levels: ['university'], detail: '대학 학과·동아리·취업지원센터' }
  }
  return { levels: ['adult', 'university'], detail: '성인 학습 기관과 대학' }
}

function octoberBounds(reference: Dayjs): { start: Dayjs; end: Dayjs } {
  const start = dayjs(`${reference.year()}-10-01`).startOf('day')
  return { start, end: start.endOf('month').startOf('day') }
}

/**
 * 연수 요청 시작일의 상한.
 * 목록 기본 필터는 올해 1월 1일~접속일이므로, 접속일이 10월 안이면 그 날까지로 자른다.
 */
function latestTrainingStartInOctober(reference: Dayjs, octoberStart: Dayjs, octoberEnd: Dayjs): Dayjs {
  const today = reference.startOf('day')
  if (today.isBefore(octoberStart, 'day')) return octoberStart
  if (today.isAfter(octoberEnd, 'day')) return octoberEnd
  return today
}

function periods(
  period: GeminiRecruitmentDevAutofillCase['period'],
  reference: Dayjs
): {
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
} {
  const { start: octoberStart, end: octoberEnd } = octoberBounds(reference)
  const trainingStartCap = weekdayOnOrBefore(
    latestTrainingStartInOctober(reference, octoberStart, octoberEnd),
    octoberStart
  )
  const monthLastWeekday = weekdayOnOrBefore(octoberEnd, octoberStart)
  const applicationStart = weekdayOnOrAfter(octoberStart, monthLastWeekday)

  if (period === 'request-after-recruitment') {
    const applicationEnd = applicationStart
    const dayAfterRecruitment = weekdayOnOrAfter(applicationEnd.add(1, 'day'), monthLastWeekday)
    const trainingStart = dayAfterRecruitment.isAfter(trainingStartCap, 'day')
      ? trainingStartCap
      : dayAfterRecruitment
    const trainingEnd = monthLastWeekday.isBefore(trainingStart, 'day')
      ? trainingStart
      : monthLastWeekday
    return {
      applicationPeriodStart: toIso(applicationStart),
      applicationPeriodEnd: toIso(applicationEnd),
      trainingRequestPeriodStart: toIso(trainingStart),
      trainingRequestPeriodEnd: toIso(trainingEnd),
    }
  }

  const preferredTrainingStart = weekdayOnOrAfter(applicationStart.add(1, 'day'), monthLastWeekday)
  const trainingStart = preferredTrainingStart.isAfter(trainingStartCap, 'day')
    ? trainingStartCap
    : preferredTrainingStart
  const applicationEndCandidate = trainingStart.add(10, 'day')
  const applicationEndLimit = monthLastWeekday.subtract(1, 'day')
  const applicationEndMax = applicationEndCandidate.isAfter(applicationEndLimit, 'day')
    ? applicationEndLimit
    : applicationEndCandidate
  const applicationEnd = weekdayOnOrBefore(
    applicationEndMax.isBefore(trainingStart, 'day') ? trainingStart : applicationEndMax,
    applicationStart
  )
  const trainingEnd = monthLastWeekday.isBefore(trainingStart, 'day') ? trainingStart : monthLastWeekday
  return {
    applicationPeriodStart: toIso(applicationStart),
    applicationPeriodEnd: toIso(applicationEnd),
    trainingRequestPeriodStart: toIso(trainingStart),
    trainingRequestPeriodEnd: toIso(trainingEnd),
  }
}

function recruitmentCopy(input: {
  educationForm: GeminiRecruitmentDevAutofillCase['educationForm']
  targetDetail: string
}): {
  programDescription: string
  recruitmentGuide: string
  applicationMethod: string
  learningSupportContent: string
  notes: string
  additionalContentMarkdown: string
  institutionSectionDescription: string
  detailSectionDescription: string
} {
  const visitsInstitution = input.educationForm === 'offline'
  return {
    programDescription: visitsInstitution
      ? `참여 기관이 희망 일정을 요청하면 강사가 기관에 방문해 진행하는 경제금융 연수입니다. 대상은 ${input.targetDetail}입니다.`
      : `참여 기관이 희망 일정을 요청하면 온라인으로 진행하는 경제금융 연수입니다. 대상은 ${input.targetDetail}입니다.`,
    recruitmentGuide: '참여를 원하는 기관은 기관 모집 기간 안에 신청서를 제출해 주세요.',
    applicationMethod:
      '홈페이지에서 기관 정보와 희망 연수 일정을 작성해 신청합니다. 담당자 확인 후 연수 요청이 확정됩니다.',
    learningSupportContent: visitsInstitution
      ? '강의 자료와 활동지를 방문 기관에 제공합니다.'
      : '강의 자료와 활동지를 신청 기관에 전달하고, 온라인 접속 안내를 함께 제공합니다.',
    notes: '희망 연수일은 연수 요청 가능기간 안에서 기관과 조율합니다.',
    additionalContentMarkdown: '최소 수강 인원은 15명이며, 기관 단위로 신청합니다.',
    institutionSectionDescription: '참여 기관이 연수를 신청할 때 보는 모집 안내입니다.',
    detailSectionDescription: '기관이 요청한 일정에 진행하는 연수 상세 안내입니다.',
  }
}

export function pickGeminiRecruitmentDevAutofillCase(): GeminiRecruitmentDevAutofillCase {
  return {
    notes: pick(NOTES_CASES),
    educationTarget: pick(TARGET_CASES),
    educationForm: pick(FORM_CASES),
    announcement: pick(ANNOUNCEMENT_CASES),
    period: pick(PERIOD_CASES),
    sectionDescription: pick(DESCRIPTION_CASES),
  }
}

export function buildGeminiRecruitmentDevAutofillSnapshot(
  autofillCase: GeminiRecruitmentDevAutofillCase = pickGeminiRecruitmentDevAutofillCase(),
  referenceDate: Dayjs = dayjs()
): GeminiRecruitmentAddFormSnapshot {
  const defaults = createDefaultGeminiRecruitmentAddFormSnapshot()
  const target = educationTargets(autofillCase.educationTarget)
  const range = periods(autofillCase.period, referenceDate)
  const notesNotApplicable = autofillCase.notes === 'not-applicable'
  const descriptionsShown = autofillCase.sectionDescription === 'shown'
  const copy = recruitmentCopy({
    educationForm: autofillCase.educationForm,
    targetDetail: target.detail,
  })

  return {
    ...defaults,
    title: pick(titles(referenceDate.year())),
    announcementPublished: autofillCase.announcement,
    educationTargetLevels: target.levels,
    educationTargetDetail: target.detail,
    ...range,
    minStudentCount: GEMINI_DEV_MIN_STUDENT_COUNT,
    educationForm: autofillCase.educationForm,
    educationStructure: 'SCHEDULE',
    inquiryContactName: 'JA Korea 찾아가는 연수',
    inquiryTel: '02-1234-5678',
    inquiryEmail: 'gemini-dev@jakorea.org',
    notesNotApplicable,
    notes: notesNotApplicable ? '' : copy.notes,
    programDescription: copy.programDescription,
    recruitmentGuide: copy.recruitmentGuide,
    applicationMethod: copy.applicationMethod,
    learningSupportContent: copy.learningSupportContent,
    additionalContentMarkdown: copy.additionalContentMarkdown,
    institutionSectionDescription: descriptionsShown ? copy.institutionSectionDescription : '',
    detailSectionDescription: descriptionsShown ? copy.detailSectionDescription : '',
  }
}
