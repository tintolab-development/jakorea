/**
 * 일반 프로그램 등록 — 필수 미입력 진단 키를 「탭 이름 > 항목명」 목록으로 바꾼다 (QA-0042).
 * UJAT 팝업(`formatUjatRegistrationRequiredFieldReasons`)처럼 항목 라벨을 나열하고,
 * 탭 미입력 개수·클릭 이동에 쓸 단계 키를 함께 돌려준다.
 */
import {
  GENERAL_PROGRAM_RECRUIT_TAB_LABELS,
  GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS,
  type GeneralProgramRegistrationApplicationTabKey,
  type GeneralProgramRegistrationStepKey,
} from '@/features/program/general/model/registration-flow'
import { formatGeneralProgramRegistrationRequiredFieldReason } from '@/features/program/general/lib/registration-required-fields'

/** 공통 정보 단계(탭 없음) 표시 이름 */
export const GENERAL_REGISTRATION_PROGRAM_STEP_LABEL = '공통 정보'

const RECRUIT_PREFIX_TO_STEP: readonly [string, GeneralProgramRegistrationStepKey][] = [
  ['recruit.institution.', 'recruit-participant-school'],
  ['recruit.individual.', 'recruit-participant-individual'],
  ['recruit.instructor.', 'recruit-instructor'],
  ['recruit.volunteer.', 'recruit-volunteer'],
]

/** 모집 단락 항목 라벨 — 화면 DetailInfoForm.Field label 과 같은 말 */
const RECRUIT_FIELD_LABELS: Record<string, string> = {
  announcementPublished: '공고 게시 여부',
  interviewRequired: '면접 유무',
  programRangeSeal: '프로그램 운영 기간',
  recruitRangeSeal: '모집 기간',
  finalAnnounceIso: '최종 합격자 발표일',
  finalAnnounceMethod: '최종 합격자 발표 방법',
  docDeadlineIso: '서류 합격자 발표일',
  docAnnounceMethod: '서류 합격자 발표 방법',
  interviewRangeSeal: '면접 기간',
  interviewMethod: '면접 방법',
  targetLevels: '교육 대상',
  targetLevelDetail: '교육 대상 상세',
  recruitTargets: '모집 대상',
  recruitTargetDetail: '모집 대상 상세',
  volunteerTargets: '모집 대상',
  volunteerTargetDetail: '모집 대상 상세',
  inquiryContact: '문의처',
  inquiryTel: '문의처 전화번호',
  inquiryEmail: '문의처 이메일',
  notes: '비고',
  notesNotApplicable: '비고',
  studentListRequired: '학생 명단 제출 여부',
  preguidanceRequired: '사전 안내 사항 작성 여부',
  maxAssignableInstructors: '최대 배정 강사 수',
  maxClassCount: '최대 학급 수',
  maxScheduleCount: '최대 일정 수',
  maxSessionsPerDay: '1일 최대 차시 수',
  interviewTimeRange: '면접 진행 가능 시간',
  interviewTime: '면접 진행 가능 시간',
  selectedSlotKeys: '면접 진행 가능 시간대',
  timeUnit: '면접 시간 단위',
  exceptionDate: '예외 일정 날짜',
}

export type GeneralRegistrationIncompleteItem = {
  /** 대표 진단 키(같은 라벨의 첫 키) — 클릭 시 해당 단락으로 이동 */
  key: string
  step: GeneralProgramRegistrationStepKey
  tabLabel: string
  fieldLabel: string
  /** `탭 이름 > 항목명` */
  text: string
}

export type ResolveIncompleteStepOptions = {
  /** 신청 양식(제공받는 곳 등) 키 — 검사한 신청 탭 */
  applicationStep?: GeneralProgramRegistrationApplicationTabKey | null
}

/** 진단 키 → 등록 단계. 알 수 없는 신청 키는 null */
export function resolveGeneralRegistrationIncompleteStep(
  key: string,
  options: ResolveIncompleteStepOptions = {}
): GeneralProgramRegistrationStepKey | null {
  for (const [prefix, step] of RECRUIT_PREFIX_TO_STEP) {
    if (key.startsWith(prefix)) return step
  }
  if (key.startsWith('application.')) return options.applicationStep ?? null
  return 'program'
}

function stepLabel(step: GeneralProgramRegistrationStepKey): string {
  if (step === 'program') return GENERAL_REGISTRATION_PROGRAM_STEP_LABEL
  if (step.startsWith('recruit-')) {
    return GENERAL_PROGRAM_RECRUIT_TAB_LABELS[step as keyof typeof GENERAL_PROGRAM_RECRUIT_TAB_LABELS]
  }
  return GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS[
    step as GeneralProgramRegistrationApplicationTabKey
  ]
}

function fieldLabel(key: string, step: GeneralProgramRegistrationStepKey): string {
  if (step === 'program') return formatGeneralProgramRegistrationRequiredFieldReason(key)
  if (key.startsWith('application.thirdParty.')) return '개인정보 제3자 제공 동의 > 제공받는 곳'
  const leaf = key.slice(key.lastIndexOf('.') + 1)
  return RECRUIT_FIELD_LABELS[leaf] ?? '필수 항목'
}

/** 진단 키 목록 → 「탭 > 항목」 목록 (같은 문구는 한 번만, 입력 순서 유지) */
export function buildGeneralRegistrationIncompleteItems(
  keys: readonly string[],
  options: ResolveIncompleteStepOptions = {}
): GeneralRegistrationIncompleteItem[] {
  const seen = new Set<string>()
  const items: GeneralRegistrationIncompleteItem[] = []
  for (const key of keys) {
    const step = resolveGeneralRegistrationIncompleteStep(key, options)
    if (step == null) continue
    const tabLabel = stepLabel(step)
    const label = fieldLabel(key, step)
    const text = `${tabLabel} > ${label}`
    if (seen.has(text)) continue
    seen.add(text)
    items.push({ key, step, tabLabel, fieldLabel: label, text })
  }
  return items
}

/** 탭(단계)별 미입력 항목 수 — 탭 제목 표시용 */
export function countGeneralRegistrationIncompleteByStep(
  keys: Iterable<string>,
  options: ResolveIncompleteStepOptions = {}
): Partial<Record<GeneralProgramRegistrationStepKey, number>> {
  const items = buildGeneralRegistrationIncompleteItems([...keys], options)
  const counts: Partial<Record<GeneralProgramRegistrationStepKey, number>> = {}
  for (const item of items) counts[item.step] = (counts[item.step] ?? 0) + 1
  return counts
}
