/**
 * 일반 프로그램 — 선택 승인/반려·면접 일괄 시 「이미 처리된 행」안내 카피 SSOT
 */

import {
  screeningSubjectNoun,
  type ScreeningSubjectKind,
} from '@/features/program/general/lib/screening-subject-kind'

export type ApplicationBulkSubjectNoun =
  | 'institution'
  | 'instructor'
  | 'participant'
  | 'volunteer'

const APPLICATION_BULK_SUBJECT_LABEL: Record<ApplicationBulkSubjectNoun, string> = {
  institution: '기관',
  instructor: '강사',
  participant: '참여자',
  volunteer: '봉사자',
}

export function applicationBulkSubjectLabel(noun: ApplicationBulkSubjectNoun): string {
  return APPLICATION_BULK_SUBJECT_LABEL[noun]
}

/** 주어 뒤 주격 조사 — 받침 있으면 `이`, 없으면 `가` (`기관이` / `강사가`) */
function subjectCaseParticle(label: string): '이' | '가' {
  return label === '기관' ? '이' : '가'
}

/** 승인/반려 목록 — 이미 처리된 행 포함 시 AlertModal */
export function buildApplicationProcessedSelectionAlert(noun: ApplicationBulkSubjectNoun): {
  title: string
  content: string
} {
  const label = applicationBulkSubjectLabel(noun)
  const particle = subjectCaseParticle(label)
  return {
    title: '신청 처리 완료 안내',
    content: `이미 승인 또는 반려 완료된 ${label}${particle} 포함되어 있습니다.\n승인 대기 중인 ${label}만 선택해 주세요.`,
  }
}

/** 2차 면접 — 이미 처리된 행 포함 시 AlertModal (선택 가능 = 면접 대기만) */
export function buildInterview2ProcessedSelectionAlert(kind: ScreeningSubjectKind): {
  title: string
  content: string
} {
  const label = screeningSubjectNoun(kind)
  const particle = subjectCaseParticle(label)
  return {
    title: '면접 처리 완료 안내',
    content: `이미 합격 또는 불합격 처리된 ${label}${particle} 포함되어 있습니다.\n면접 대기 중인 ${label}만 선택해 주세요.`,
  }
}
