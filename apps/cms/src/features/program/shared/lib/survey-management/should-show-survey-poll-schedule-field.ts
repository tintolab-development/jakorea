import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationScheduleParagraph,
} from '@/features/program/general/lib/institution-application-program-bridge'
import type { Program } from '@/types/domain'

/** 신청 양식 「진행 희망 교육 일정」 단락 노출과 동일 — 설문 등록 모달 일정 선택 필드 SSOT */
export function shouldShowSurveyPollScheduleSelectField(
  program: Program | null | undefined
): boolean {
  if (program == null) return true
  return shouldShowInstitutionApplicationScheduleParagraph(
    resolveInstitutionApplicationProgramBridge(program)
  )
}
