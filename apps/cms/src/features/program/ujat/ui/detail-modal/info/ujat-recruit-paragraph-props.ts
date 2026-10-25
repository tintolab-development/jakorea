import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'

export type UjatRecruitParagraphMode = 'edit' | 'view'

export type UjatVolunteerRecruitHalf = 'h1' | 'h2'

export type UjatRecruitParagraphProps = {
  mode?: UjatRecruitParagraphMode
  program?: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  volunteerHalf?: UjatVolunteerRecruitHalf
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
  exceptionScheduleCount?: number
  /** draft `paragraphTitle` — 프로그램 상세에서만 노출 (`paragraphDescription`은 미노출) */
  sectionTitle?: string
  /** 등록 시드 단락 id — 상세 수정 필수 누락 제목 강조 */
  highlightParagraphId?: string
  /** 독립 Template Authoring — Form Version settingsJson의 typed 상태 키 */
  templateCode?: string
  templateAuthoring?: boolean
}

export function resolveUjatRecruitParagraphMode(props: UjatRecruitParagraphProps): UjatRecruitParagraphMode {
  if (props.mode) return props.mode
  if (props.program && props.form) return 'edit'
  if (props.program) return 'view'
  return 'edit'
}

export function isUjatRecruitProgramContext(props: UjatRecruitParagraphProps): boolean {
  return props.program != null
}
