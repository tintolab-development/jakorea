/**
 * Gemini 찾아가는 연수 모집 공고 — 개발용 자동입력.
 * 호출마다 비고·교육 대상·교육 형태·게시·기간·섹션 설명 케이스를 하나씩 고른다.
 * 첨부·썸네일은 파일 업로드라 채우지 않는다.
 * 운영 빌드에서는 호출하지 말 것 (`import.meta.env.DEV` 가드).
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiRecruitmentAddFormSnapshot } from './add-local-save'
import { createDefaultGeminiRecruitmentAddFormSnapshot } from './add-local-save'

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

const TITLES = [
  '2026 찾아가는 경제금융 연수',
  '대학생 기업가정신 찾아가는 연수',
  '성인 금융이해력 방문 연수',
  '지역 평생교육 찾아가는 연수',
] as const

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function upcomingWeekday(daysAhead: number): Dayjs {
  let date = dayjs().add(daysAhead, 'day').startOf('day')
  while (date.day() === 0 || date.day() === 6) date = date.add(1, 'day')
  return date
}

function toIso(date: Dayjs): string {
  return date.startOf('day').toISOString()
}

function educationTargets(
  target: GeminiRecruitmentDevAutofillCase['educationTarget']
): { levels: string[]; detail: string } {
  if (target === 'adult') {
    return { levels: ['adult'], detail: '지역 성인 학습자·직장인' }
  }
  if (target === 'university') {
    return { levels: ['university'], detail: '대학 동아리·학과 단위' }
  }
  return { levels: ['adult', 'university'], detail: '성인 학습자와 대학생을 함께 모집' }
}

function periods(period: GeminiRecruitmentDevAutofillCase['period']): {
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
} {
  if (period === 'request-after-recruitment') {
    const applicationStart = upcomingWeekday(7)
    const applicationEnd = applicationStart.add(14, 'day')
    const trainingStart = applicationEnd.add(1, 'day')
    const trainingEnd = trainingStart.add(30, 'day')
    return {
      applicationPeriodStart: toIso(applicationStart),
      applicationPeriodEnd: toIso(applicationEnd),
      trainingRequestPeriodStart: toIso(trainingStart),
      trainingRequestPeriodEnd: toIso(trainingEnd),
    }
  }

  const applicationStart = upcomingWeekday(3)
  const applicationEnd = applicationStart.add(21, 'day')
  const trainingStart = applicationStart.add(7, 'day')
  const trainingEnd = applicationEnd.add(14, 'day')
  return {
    applicationPeriodStart: toIso(applicationStart),
    applicationPeriodEnd: toIso(applicationEnd),
    trainingRequestPeriodStart: toIso(trainingStart),
    trainingRequestPeriodEnd: toIso(trainingEnd),
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
  autofillCase: GeminiRecruitmentDevAutofillCase = pickGeminiRecruitmentDevAutofillCase()
): GeminiRecruitmentAddFormSnapshot {
  const defaults = createDefaultGeminiRecruitmentAddFormSnapshot()
  const target = educationTargets(autofillCase.educationTarget)
  const range = periods(autofillCase.period)
  const notesNotApplicable = autofillCase.notes === 'not-applicable'
  const descriptionsShown = autofillCase.sectionDescription === 'shown'
  const formLabel = autofillCase.educationForm === 'online' ? '온라인' : '오프라인'

  return {
    ...defaults,
    title: pick(TITLES),
    announcementPublished: autofillCase.announcement,
    educationTargetLevels: target.levels,
    educationTargetDetail: target.detail,
    ...range,
    minStudentCount: 20,
    educationForm: autofillCase.educationForm,
    educationStructure: 'SCHEDULE',
    inquiryContactName: 'JA Korea 연수팀',
    inquiryTel: '02-1234-5678',
    inquiryEmail: 'gemini-dev@jakorea.org',
    notesNotApplicable,
    notes: notesNotApplicable ? '' : '교재는 방문 당일 현장 배부합니다.',
    programDescription: `${formLabel}으로 진행하는 찾아가는 연수 개발용 샘플입니다.`,
    recruitmentGuide: '홈페이지에서 기관 신청서를 작성해 제출해 주세요.',
    applicationMethod: '모집 기간 내 온라인 신청 후 담당자 확인을 거칩니다.',
    learningSupportContent: '강의 자료와 활동지를 기관에 제공합니다.',
    additionalContentMarkdown: '개발용 자동입력으로 채운 추가 내용입니다.',
    institutionSectionDescription: descriptionsShown
      ? '참여 기관 모집 안내입니다.'
      : '',
    detailSectionDescription: descriptionsShown ? '연수 상세 안내입니다.' : '',
  }
}
