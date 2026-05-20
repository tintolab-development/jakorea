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
