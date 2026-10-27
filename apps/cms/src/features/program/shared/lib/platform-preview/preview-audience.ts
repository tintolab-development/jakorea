import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import { listVisibleOperationalFormSpecs } from '@/features/program/general/lib/operational-form-bindings'
import { resolveProgramOperationalBindingKind } from '@/features/program/general/lib/program-operational-binding-profile'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import {
  pickRecruitmentCopyRow,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'

/** 모집 미리보기 4종. 상세 탭 `institutions`는 개인 프로그램이면 `individuals`로 연다. */
export const PROGRAM_PREVIEW_AUDIENCES = [
  'institutions',
  'individuals',
  'instructors',
  'volunteers',
] as const

export type ProgramPreviewAudience = (typeof PROGRAM_PREVIEW_AUDIENCES)[number]

export function previewCopyAudienceForTab(
  audience: ProgramPreviewAudience
): RecruitmentCopyAudience {
  if (audience === 'instructors') return 'instructor'
  if (audience === 'volunteers') return 'volunteer'
  return 'participant'
}

function previewRecruitmentTargetRole(
  audience: ProgramPreviewAudience
): 'ORGANIZATION' | 'INDIVIDUAL' | 'INSTRUCTOR' | 'VOLUNTEER' | undefined {
  if (audience === 'institutions') return 'ORGANIZATION'
  if (audience === 'individuals') return 'INDIVIDUAL'
  if (audience === 'instructors') return 'INSTRUCTOR'
  if (audience === 'volunteers') return 'VOLUNTEER'
  return undefined
}

/** 저장·operational form spec과 동일한 모집 catalog — 미리보기 overlay peek SSOT */
export function recruitmentPreviewCatalogCodes(
  program: Program,
  audience: ProgramPreviewAudience
): string[] {
  const targetRole = previewRecruitmentTargetRole(audience)
  if (targetRole == null) return []

  const fromSpecs = [
    ...new Set(
      listVisibleOperationalFormSpecs(program)
        .filter(spec => spec.formType === 'RECRUITMENT' && spec.targetRole === targetRole)
        .map(spec => spec.templateCode)
    ),
  ]
  if (fromSpecs.length > 0) return fromSpecs
  return [recruitmentPreviewCatalogCodeFallback(program, audience)]
}

function recruitmentPreviewCatalogCodeFallback(
  program: Program,
  audience: ProgramPreviewAudience
): string {
  const type = program.backendProgramType?.trim().toUpperCase()
  const kind = resolveProgramOperationalBindingKind(program)
  if (audience === 'instructors') return 'recruitment-instructor'
  if (audience === 'volunteers') {
    return type === 'UJAT' || kind === 'UJAT' ? 'recruitment-ujat-volunteer' : 'recruitment-volunteer'
  }
  if (audience === 'individuals') return 'recruitment-participant-individual'
  if (type === 'COMPANY_SCHOOL' || kind === 'COMPANY_SCHOOL') return 'recruitment-economy'
  if (type === 'TRAINED_TEACHER' || kind === 'TRAINED_TEACHER') {
    return 'recruitment-trained-teachers'
  }
  if (type === 'UJAT' || kind === 'UJAT') return 'recruitment-ujat-school'
  if (isCompanySchoolProgram(program)) return 'recruitment-economy'
  if (looksLikeTrainedTeacherProgramId(String(program.id))) return 'recruitment-trained-teachers'
  return 'recruitment-participant-school'
}

export function recruitmentPreviewCatalogCode(
  program: Program,
  audience: ProgramPreviewAudience
): string {
  return recruitmentPreviewCatalogCodes(program, audience)[0] ?? 'recruitment-participant-school'
}

/** 참여자·참여기관은 applicationType이 다른 PARTICIPANT 행이다. */
export function pickPreviewRecruitmentRow(
  program: Program,
  audience: ProgramPreviewAudience
): ProgramRecruitmentWindow | undefined {
  if (audience === 'instructors') return pickRecruitmentCopyRow(program, 'instructor')
  if (audience === 'volunteers') return pickRecruitmentCopyRow(program, 'volunteer')
  const participants = (program.programRecruitments ?? []).filter(
    row => (row.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
  )
  const want = audience === 'individuals' ? 'INDIVIDUAL' : 'ORGANIZATION'
  const typed = participants.find(row => (row.applicationType ?? '').toUpperCase() === want)
  if (typed) return typed
  if (participants.length === 1) return participants[0]
  return pickRecruitmentCopyRow(program, 'participant')
}

export function isPreviewAudienceOverlayKey(
  audience: ProgramPreviewAudience,
  key: string
): boolean {
  if (audience === 'instructors') {
    return key.startsWith('recruit.instructor.') || key.startsWith('recruitInstructor.')
  }
  if (audience === 'volunteers') {
    return key.startsWith('recruit.volunteer.') || key.startsWith('recruitVolunteer.')
  }
  if (audience === 'individuals') {
    return key.startsWith('recruit.individual.') || key.startsWith('recruit.detailInfo.')
  }
  if (key.startsWith('recruit.instructor.') || key.startsWith('recruitInstructor.')) return false
  if (key.startsWith('recruit.volunteer.') || key.startsWith('recruitVolunteer.')) return false
  if (key.startsWith('recruit.individual.')) return false
  return (
    key.startsWith('recruit.') ||
    key.startsWith('economyRecruit.') ||
    key.startsWith('trainedTeachersRecruit.') ||
    key.startsWith('ujatRecruit.') ||
    key.startsWith('geminiRecruit.')
  )
}

export function pickAudienceLiveOverlay(
  overlay: Record<string, unknown>,
  audience: ProgramPreviewAudience
): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (isPreviewAudienceOverlayKey(audience, key)) next[key] = value
  }
  return next
}
