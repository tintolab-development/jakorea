/**
 * Gemini 모집 공고 「정보 수정」 — 일반 프로그램 모집 탭과 동일.
 * 기관 모집 시작 시각(`startAt`과 같은 applicationPeriodStart)부터 잠그고,
 * 같은 안내 모달을 띄운다. 모집 마감일이 기준이 아니다.
 */

import {
  PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE,
  PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
} from '@/shared/lib/program-edit-window-error-message'
import { isRecruitmentStartLocked } from '@/features/program/shared/lib/program-edit-window'

export function canGeminiRecruitmentInfoEdit(
  applicationPeriodStart: string | null | undefined,
  now: Date = new Date()
): boolean {
  return !isRecruitmentStartLocked(applicationPeriodStart, now)
}

export function getGeminiRecruitmentInfoEditBlockedAlertTitle(): string {
  return PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE
}

export function getGeminiRecruitmentInfoEditBlockedAlertMessage(): string {
  return PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE
}
