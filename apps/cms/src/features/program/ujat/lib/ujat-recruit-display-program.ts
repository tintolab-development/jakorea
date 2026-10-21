import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  buildUjatRecruitInstitutionOverlayFromDetailEditValues,
  pickUjatRecruitInstitutionOverlay,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  pickUjatRecruitVolunteerOverlay,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { hydrateRecruitmentWindowsOntoProgram } from '@/features/program/shared/lib/hydrate-recruitment-windows'
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

function nonemptyField(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** UJAT GET — 봉사 반기는 recruitTerm만. startAt 정렬로 h1/h2를 추측하지 않는다. */
export function pickUjatVolunteerRecruitmentRow(
  program: Program,
  half: UjatVolunteerRecruitHalf
): ProgramRecruitmentWindow | undefined {
  const term = half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
  return (program.programRecruitments ?? []).find(
    row =>
      (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' && row.recruitTerm === term
  )
}

function applyUjatRecruitmentRowCanonicalFields(
  program: Program,
  row: ProgramRecruitmentWindow | undefined,
  options?: { volunteerHalf?: boolean }
): Program {
  if (!row) return program
  const opStart = nonemptyField(row.operationStartDate)
  const opEnd = nonemptyField(row.operationEndDate)
  const interviewStart = nonemptyField(row.interviewStartAt)
  const interviewEnd = nonemptyField(row.interviewEndAt)
  const contactName = nonemptyField(row.contactName)
  const contactPhone = nonemptyField(row.contactPhone)
  const contactEmail = nonemptyField(row.contactEmail)
  const startAt = nonemptyField(row.startAt)
  const endAt = nonemptyField(row.endAt)
  const volunteerInfo = {
    ...(program.generalCommonInfo?.volunteerRecruitmentInfo ?? {}),
    ...(contactName ? { contactOrganizationName: contactName, contactName } : { contactOrganizationName: '', contactName: '' }),
    ...(contactPhone ? { inquiryTel: contactPhone, contactPhone } : { inquiryTel: '', contactPhone: '' }),
    ...(contactEmail ? { inquiryEmail: contactEmail, contactEmail } : { inquiryEmail: '', contactEmail: '' }),
    ...(interviewStart ? { interviewStartDate: interviewStart } : { interviewStartDate: '' }),
    ...(interviewEnd ? { interviewEndDate: interviewEnd } : { interviewEndDate: '' }),
  }
  const participantInfo = {
    ...(program.generalCommonInfo?.participantRecruitmentInfo ?? {}),
    ...(contactName ? { contactOrganizationName: contactName, contactName } : { contactOrganizationName: '', contactName: '' }),
    ...(contactPhone ? { inquiryTel: contactPhone, contactPhone } : { inquiryTel: '', contactPhone: '' }),
    ...(contactEmail ? { inquiryEmail: contactEmail, contactEmail } : { inquiryEmail: '', contactEmail: '' }),
  }
  return {
    ...program,
    startDate: opStart ?? '',
    endDate: opEnd ?? '',
    interviewStartDate: interviewStart ?? '',
    interviewEndDate: interviewEnd ?? '',
    managerName: contactName ?? '',
    contactName: contactName ?? '',
    contactPhone: contactPhone ?? '',
    contactEmail: contactEmail ?? '',
    ...(options?.volunteerHalf
      ? {
          volunteerApplicationStartDate: startAt ?? '',
          volunteerApplicationEndDate: endAt ?? '',
        }
      : {}),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      ...(options?.volunteerHalf
        ? { volunteerRecruitmentInfo: volunteerInfo }
        : { participantRecruitmentInfo: participantInfo }),
    },
  }
}

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
  return compactOverlay(pickUjatRecruitInstitutionOverlay(program.ujatRegistrationOverlay ?? {}))
}

function mergedVolunteerOverlay(program: Program): Record<string, unknown> {
  return compactOverlay(pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {}))
}

/** 모집 탭 전용 — GET 행이 있으면 기간·문의처·면접은 행 SSOT. 위저드(행 없음)는 overlay. */
export function resolveUjatRecruitDisplayProgram(
  program: Program,
  kind?: UjatRecruitDisplayKind
): Program {
  const fromRows = hydrateRecruitmentWindowsOntoProgram(program)
  if (kind === 'institution') {
    const row = pickRecruitmentCopyRow(fromRows, 'participant')
    return applyUjatRecruitmentRowCanonicalFields(
      hydrateRecruitmentWindowsOntoProgram(
        applyRecruitmentRowCopy(
          applyUjatRecruitInstitutionOverlayOntoProgram(
            fromRows,
            mergedInstitutionOverlay(program),
            { preferOverlay: row == null }
          ),
          'participant'
        )
      ),
      row
    )
  }
  if (kind === 'volunteer' || kind === 'volunteer_h1' || kind === 'volunteer_h2') {
    const half = volunteerHalfFromRecruitDisplayKind(kind)
    const overlay = mergedVolunteerOverlay(program)
    if (half == null) {
      const row = pickRecruitmentCopyRow(fromRows, 'volunteer')
      return applyUjatRecruitmentRowCanonicalFields(
        hydrateRecruitmentWindowsOntoProgram(
          applyRecruitmentRowCopy(
            applyUjatRecruitVolunteerOverlayOntoProgram(fromRows, overlay, {
              preferOverlay: row == null,
            }),
            'volunteer'
          )
        ),
        row,
        { volunteerHalf: true }
      )
    }
    const row = pickUjatVolunteerRecruitmentRow(fromRows, half)
    return applyUjatRecruitmentRowCanonicalFields(
      applyRecruitmentRowCopy(
        applyUjatRecruitVolunteerOverlayOntoProgram(
          blankUjatVolunteerRecruitProgramFields(fromRows),
          resolveVolunteerOverlayForHalf(overlay, half),
          { preferOverlay: row == null }
        ),
        'volunteer',
        half
      ),
      row,
      { volunteerHalf: true }
    )
  }
  return fromRows
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
  const title =
    (audience === 'volunteer' && half
      ? pickUjatVolunteerRecruitmentRow(program, half)
      : pickRecruitmentCopyRow(program, audience, half)
    )?.announcementTitle
  return typeof title === 'string' && title.trim() ? title.trim() : undefined
}

/** 공고용 프로그램명 — GET 행 우선, 없으면 모집 overlay. 공통정보와 공유하지 않는다. */
export function resolveUjatRecruitAnnouncementTitle(
  program: Program,
  kind: UjatRecruitDisplayKind
): string {
  const fromRow = rowAnnouncementTitle(program, kind)
  if (kind === 'institution') {
    return (
      fromRow ||
      overlayString(mergedInstitutionOverlay(program), UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle) ||
      '-'
    )
  }
  const overlay = mergedVolunteerOverlay(program)
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  if (half) {
    return (
      fromRow ||
      overlayString(overlay, ujatVolunteerHalfOverlayKey(half, 'publicTitle')) ||
      '-'
    )
  }
  return (
    fromRow ||
    overlayString(overlay, UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.publicTitle) ||
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
    rowCopy && half === 'h2' && !pickUjatVolunteerRecruitmentRow(args.existing, 'h2')
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
