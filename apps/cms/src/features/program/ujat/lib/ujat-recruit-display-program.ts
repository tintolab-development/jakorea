import type { Program } from '@/types/domain'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  applyUjatRecruitInstitutionTemplateDefaults,
  buildUjatRecruitInstitutionOverlayFromDetailEditValues,
  pickUjatRecruitInstitutionOverlay,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  applyUjatRecruitVolunteerTemplateDefaults,
  pickUjatRecruitVolunteerOverlay,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  loadUjatRecruitInstitutionTemplateSave,
  loadUjatRecruitVolunteerTemplateSave,
} from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import {
  blankUjatVolunteerRecruitProgramFields,
  buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues,
  resolveVolunteerOverlayForHalf,
  restoreUjatVolunteerRecruitProgramColumns,
  snapshotVolunteerHalfFromLegacy,
  ujatVolunteerHalfOverlayKey,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  applyRecruitmentRowCopy,
  pickRecruitmentCopyRow,
  writeRecruitmentRowCopy,
} from '@/features/program/shared/lib/recruitment-row-copy'

export type UjatRecruitDisplayKind = 'institution' | 'volunteer' | 'volunteer_h1' | 'volunteer_h2'

export function volunteerHalfFromRecruitDisplayKind(
  kind: UjatRecruitDisplayKind
): UjatVolunteerRecruitHalf | null {
  if (kind === 'volunteer_h1') return 'h1'
  if (kind === 'volunteer_h2') return 'h2'
  return null
}

export function ujatRecruitDisplayKindFromVolunteerHalf(
  half: UjatVolunteerRecruitHalf
): UjatRecruitDisplayKind {
  return half === 'h2' ? 'volunteer_h2' : 'volunteer_h1'
}

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const value = overlay[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** 카탈로그 시드·빈 행 값이 등록 overlay를 덮지 않게 빈 값은 버린다. */
function compactOverlay(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value == null) continue
    if (typeof value === 'string' && !value.trim()) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = compactOverlay(value as Record<string, unknown>)
      if (Object.keys(nested).length === 0) continue
      out[key] = nested
      continue
    }
    out[key] = value
  }
  return out
}

function mergedInstitutionOverlay(program: Program): Record<string, unknown> {
  return compactOverlay({
    ...(loadUjatRecruitInstitutionTemplateSave()?.overlay ?? {}),
    ...pickUjatRecruitInstitutionOverlay(program.ujatRegistrationOverlay ?? {}),
  })
}

function mergedVolunteerOverlay(program: Program): Record<string, unknown> {
  return compactOverlay({
    ...(loadUjatRecruitVolunteerTemplateSave()?.overlay ?? {}),
    ...pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {}),
  })
}

/** 모집 탭 전용 — kind가 있으면 해당 overlay만 적용. 공통정보 displayProgram에는 쓰지 않는다. */
export function resolveUjatRecruitDisplayProgram(
  program: Program,
  kind?: UjatRecruitDisplayKind
): Program {
  if (kind === 'institution') {
    return applyRecruitmentRowCopy(
      applyUjatRecruitInstitutionOverlayOntoProgram(program, mergedInstitutionOverlay(program)),
      'participant'
    )
  }
  if (kind === 'volunteer' || kind === 'volunteer_h1' || kind === 'volunteer_h2') {
    const half = volunteerHalfFromRecruitDisplayKind(kind)
    const overlay = mergedVolunteerOverlay(program)
    if (half == null) {
      return applyRecruitmentRowCopy(
        applyUjatRecruitVolunteerOverlayOntoProgram(program, overlay),
        'volunteer'
      )
    }
    return applyRecruitmentRowCopy(
      applyUjatRecruitVolunteerOverlayOntoProgram(
        blankUjatVolunteerRecruitProgramFields(program),
        resolveVolunteerOverlayForHalf(overlay, half)
      ),
      'volunteer',
      half
    )
  }
  return applyUjatRecruitVolunteerTemplateDefaults(
    applyUjatRecruitInstitutionTemplateDefaults(program),
    pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {})
  )
}

function volunteerHalfPeriod(
  values: ProgramDetailEditFormValues,
  _half: UjatVolunteerRecruitHalf
): {
  startAt?: string | null
  endAt?: string | null
  interviewEnabled?: boolean
  interviewStartAt?: string | null
  interviewEndAt?: string | null
} {
  const startAt = values.volunteerApplicationStartDate?.trim() || null
  const endAt = values.volunteerApplicationEndDate?.trim() || null
  const interviewStartAt = values.interviewStartDate?.trim() || null
  const interviewEndAt = values.interviewEndDate?.trim() || null
  return {
    ...(startAt || endAt ? { startAt, endAt } : {}),
    interviewEnabled: true,
    interviewStartAt,
    interviewEndAt,
  }
}

function rowAnnouncementTitle(
  program: Program,
  kind: UjatRecruitDisplayKind
): string | undefined {
  const audience = kind === 'institution' ? 'participant' : 'volunteer'
  const half = volunteerHalfFromRecruitDisplayKind(kind) ?? undefined
  const title = pickRecruitmentCopyRow(program, audience, half)?.announcementTitle
  return typeof title === 'string' && title.trim() ? title.trim() : undefined
}

/** 공고용 프로그램명 — 모집 overlay, 없으면 해당 모집 행. 공통정보와 공유하지 않는다. */
export function resolveUjatRecruitAnnouncementTitle(
  program: Program,
  kind: UjatRecruitDisplayKind
): string {
  if (kind === 'institution') {
    return (
      overlayString(mergedInstitutionOverlay(program), UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle) ||
      rowAnnouncementTitle(program, kind) ||
      '-'
    )
  }
  const overlay = mergedVolunteerOverlay(program)
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  if (half) {
    return (
      overlayString(overlay, ujatVolunteerHalfOverlayKey(half, 'publicTitle')) ||
      rowAnnouncementTitle(program, kind) ||
      '-'
    )
  }
  return (
    overlayString(overlay, UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.publicTitle) ||
    rowAnnouncementTitle(program, kind) ||
    '-'
  )
}

export function ujatRecruitPublicTitleOverlayKey(kind: UjatRecruitDisplayKind): string {
  if (kind === 'institution') return UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  if (half) return ujatVolunteerHalfOverlayKey(half, 'publicTitle')
  return UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.publicTitle
}

/** 모집 저장 — 해당 유형/반기 overlay만 갱신. 공통정보 announcementTitle은 유지 */
export function applyUjatRecruitAnnouncementTitleToDraft(args: {
  draft: Program
  existing: Program
  title: string | undefined
  kind: UjatRecruitDisplayKind
  values?: ProgramDetailEditFormValues
}): Program {
  const half = volunteerHalfFromRecruitDisplayKind(args.kind)
  const existingOverlay = args.existing.ujatRegistrationOverlay ?? {}
  const institutionHtml =
    args.draft.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml
  const halfOverlay =
    half && args.values
      ? buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(args.values, half)
      : args.kind === 'institution' && args.values
        ? {
            ...buildUjatRecruitInstitutionOverlayFromDetailEditValues(args.values),
            ...(typeof institutionHtml === 'string'
              ? { [UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.additionalContentHtml]: institutionHtml }
              : {}),
          }
        : { [ujatRecruitPublicTitleOverlayKey(args.kind)]: args.title?.trim() ?? '' }
  const otherHalf: UjatVolunteerRecruitHalf | null =
    half === 'h1' ? 'h2' : half === 'h2' ? 'h1' : null
  const otherSnapshot =
    otherHalf != null ? snapshotVolunteerHalfFromLegacy(existingOverlay, otherHalf) : {}
  const rowCopy = args.values
    ? {
          ...(args.title !== undefined ? { announcementTitle: args.title.trim() || null } : {}),
          programDescription: args.values.description?.trim() || null,
          recruitmentGuide: args.values.recruitmentGuide?.trim() || null,
          applicationMethod: args.values.applicationMethod?.trim() || null,
          learningSupportContent: args.values.learningSupportContent?.trim() || null,
          additionalContentHtml:
            (typeof institutionHtml === 'string'
              ? institutionHtml
              : args.values.additionalContentHtml
            )?.trim() || null,
          remarks: args.values.oneLineIntroduction?.trim() || null,
          contactName:
            (args.kind === 'institution'
              ? args.values.recruitmentContactOrganizationName
              : args.values.volunteerRecruitmentContactOrganizationName
            )?.trim() || null,
          contactPhone: args.values.contactPhone?.trim() || null,
          contactEmail: args.values.contactEmail?.trim() || null,
          ...(half ? volunteerHalfPeriod(args.values, half) : {}),
        }
    : undefined
  const audience = args.kind === 'institution' ? 'participant' : 'volunteer'
  const writtenRows = rowCopy
    ? writeRecruitmentRowCopy(args.existing, audience, rowCopy, half ?? undefined)
    : undefined
  const programRecruitments =
    rowCopy && half === 'h2' && !pickRecruitmentCopyRow(args.existing, 'volunteer', 'h2')
      ? [
          ...(writtenRows ?? args.existing.programRecruitments ?? []),
          {
            recruitmentType: 'VOLUNTEER',
            targetType: 'COLLEGE_STUDENT',
            applicationType: 'VOLUNTEER',
            recruitTerm: 'SECOND_HALF' as const,
            ...rowCopy,
          },
        ]
      : writtenRows
  const next: Program = {
    ...args.draft,
    ujatRegistrationOverlay: {
      ...existingOverlay,
      ...(args.draft.ujatRegistrationOverlay ?? {}),
      ...otherSnapshot,
      ...halfOverlay,
    },
    generalCommonInfo: {
      ...args.draft.generalCommonInfo,
      announcementTitle: args.existing.generalCommonInfo?.announcementTitle,
    },
    ...(programRecruitments ? { programRecruitments } : {}),
  }
  return half ? restoreUjatVolunteerRecruitProgramColumns(next, args.existing, half) : next
}
