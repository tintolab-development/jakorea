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
import { toOperationCalendarDate } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
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
import {
  typedFieldsFromRecruitmentFormValues,
} from '@/features/program/ujat/lib/recruitment-typed-contract'
import { announcementPublishedToFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'

export type UjatRecruitDisplayKind = 'institution' | 'volunteer' | 'volunteer_h1' | 'volunteer_h2'

function hasOwnField(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function rowString(
  row: ProgramRecruitmentWindow,
  key:
    | 'startAt'
    | 'endAt'
    | 'operationStartDate'
    | 'operationEndDate'
    | 'interviewStartAt'
    | 'interviewEndAt'
    | 'contactName'
    | 'contactPhone'
    | 'contactEmail'
): string | undefined {
  if (!hasOwnField(row, key) || row[key] === undefined) return undefined
  return row[key] ?? ''
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
  const opStart = rowString(row, 'operationStartDate')
  const opEnd = rowString(row, 'operationEndDate')
  const interviewStart = rowString(row, 'interviewStartAt')
  const interviewEnd = rowString(row, 'interviewEndAt')
  const contactName = rowString(row, 'contactName')
  const contactPhone = rowString(row, 'contactPhone')
  const contactEmail = rowString(row, 'contactEmail')
  const startAt = rowString(row, 'startAt')
  const endAt = rowString(row, 'endAt')
  const volunteerInfo = {
    ...(program.generalCommonInfo?.volunteerRecruitmentInfo ?? {}),
    ...(contactName ? { contactOrganizationName: contactName, contactName } : { contactOrganizationName: '', contactName: '' }),
    ...(contactPhone ? { inquiryTel: contactPhone, contactPhone } : { inquiryTel: '', contactPhone: '' }),
    ...(contactEmail ? { inquiryEmail: contactEmail, contactEmail } : { inquiryEmail: '', contactEmail: '' }),
    ...(interviewStart ? { interviewStartDate: interviewStart } : { interviewStartDate: '' }),
    ...(interviewEnd ? { interviewEndDate: interviewEnd } : { interviewEndDate: '' }),
    ...(hasOwnField(row, 'announcementPublished')
      ? { announcementPublished: row.announcementPublished ?? undefined }
      : {}),
    ...(hasOwnField(row, 'noticeExposureTiming')
      ? { noticeExposureTiming: row.noticeExposureTiming ?? undefined }
      : {}),
    ...(hasOwnField(row, 'remarksNotApplicable')
      ? { notesNotApplicable: row.remarksNotApplicable === true }
      : {}),
  }
  const participantInfo = {
    ...(program.generalCommonInfo?.participantRecruitmentInfo ?? {}),
    ...(contactName ? { contactOrganizationName: contactName, contactName } : { contactOrganizationName: '', contactName: '' }),
    ...(contactPhone ? { inquiryTel: contactPhone, contactPhone } : { inquiryTel: '', contactPhone: '' }),
    ...(contactEmail ? { inquiryEmail: contactEmail, contactEmail } : { inquiryEmail: '', contactEmail: '' }),
    ...(hasOwnField(row, 'announcementPublished')
      ? { announcementPublished: row.announcementPublished ?? undefined }
      : {}),
    ...(hasOwnField(row, 'remarksNotApplicable')
      ? { notesNotApplicable: row.remarksNotApplicable === true }
      : {}),
  }
  return {
    ...program,
    ...(hasOwnField(row, 'volunteerTargets') && row.volunteerTargets
      ? { volunteerTargets: row.volunteerTargets }
      : {}),
    ...(hasOwnField(row, 'documentPassAnnouncementAt')
      ? { documentPassAnnouncementDate: row.documentPassAnnouncementAt ?? '' }
      : {}),
    ...(hasOwnField(row, 'finalPassAnnouncementAt')
      ? { finalPassAnnouncementDate: row.finalPassAnnouncementAt ?? '' }
      : {}),
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
          ...(startAt !== undefined ? { volunteerApplicationStartDate: startAt } : {}),
          ...(endAt !== undefined ? { volunteerApplicationEndDate: endAt } : {}),
        }
      : {
          ...(startAt !== undefined ? { applicationStartDate: startAt } : {}),
          ...(endAt !== undefined ? { applicationEndDate: endAt } : {}),
        }),
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

/**
 * 활성 UJAT 모집 상세의 canonical 표시 모델.
 *
 * Form Version authoring/legacy import은 기존 overlay helper를 사용할 수 있지만,
 * 이미 생성된 프로그램의 모집 탭은 GET `recruitments[]` 행만 읽어야 한다.
 * 행이 없을 때는 과거 overlay나 다른 반기 행으로 보완하지 않고 빈 상태를 유지한다.
 */
export function resolveUjatRecruitCanonicalDisplayProgram(
  program: Program,
  kind: UjatRecruitDisplayKind
): Program {
  const fromRows = hydrateRecruitmentWindowsOntoProgram(program)
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  const audience = kind === 'institution' ? 'participant' : 'volunteer'
  const row =
    audience === 'volunteer' && half
      ? pickUjatVolunteerRecruitmentRow(fromRows, half)
      : pickRecruitmentCopyRow(fromRows, audience, half ?? undefined)
  if (!row) return fromRows

  const withCopy = applyRecruitmentRowCopy(fromRows, audience, half ?? undefined)
  return applyUjatRecruitmentRowCanonicalFields(withCopy, row, {
    volunteerHalf: audience === 'volunteer',
  })
}

/** 활성 모집 탭의 RHF 초기값. Overlay store/프로그램 overlay를 읽지 않는다. */
export function programToUjatRecruitCanonicalFormValues(
  program: Program,
  kind: UjatRecruitDisplayKind
): ProgramDetailEditFormValues {
  const canonical = resolveUjatRecruitCanonicalDisplayProgram(program, kind)
  const values = programToDetailEditValues(canonical)
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  const row =
    kind === 'institution'
      ? pickRecruitmentCopyRow(canonical, 'participant')
      : half
        ? pickUjatVolunteerRecruitmentRow(canonical, half)
        : pickRecruitmentCopyRow(canonical, 'volunteer')
  if (!row) return values

  const volunteerRoundIndex =
    kind === 'volunteer_h1' ? 0 : kind === 'volunteer_h2' ? 1 : null
  const rounds =
    volunteerRoundIndex != null && (hasOwnField(row, 'startAt') || hasOwnField(row, 'endAt'))
      ? values.rounds.map((round, index) =>
          index === volunteerRoundIndex
            ? {
                ...round,
                ...(hasOwnField(row, 'startAt') ? { startDate: row.startAt ?? '' } : {}),
                ...(hasOwnField(row, 'endAt') ? { endDate: row.endAt ?? '' } : {}),
              }
            : round
        )
      : values.rounds

  const inquiryContactName = rowString(row, 'contactName') ?? ''
  return {
    ...values,
    rounds,
    ...(kind === 'institution'
      ? { recruitmentContactOrganizationName: inquiryContactName }
      : { volunteerRecruitmentContactOrganizationName: inquiryContactName }),
    ...(hasOwnField(row, 'contactPhone') ? { contactPhone: row.contactPhone ?? '' } : {}),
    ...(hasOwnField(row, 'contactEmail') ? { contactEmail: row.contactEmail ?? '' } : {}),
    ...(hasOwnField(row, 'announcementTitle')
      ? { announcementTitle: row.announcementTitle ?? '' }
      : {}),
    ...(kind === 'institution'
      ? {
          ...(hasOwnField(row, 'startAt') ? { applicationStartDate: row.startAt ?? '' } : {}),
          ...(hasOwnField(row, 'endAt') ? { applicationEndDate: row.endAt ?? '' } : {}),
          ...(hasOwnField(row, 'announcementPublished')
            ? {
                participantRecruitmentAnnouncementPublished: announcementPublishedToFormValue(
                  row.announcementPublished ?? undefined,
                  values.participantRecruitmentAnnouncementPublished ?? 'published'
                ),
              }
            : {}),
          ...(hasOwnField(row, 'remarksNotApplicable')
            ? {
                participantRecruitmentNotesNotApplicable:
                  row.remarksNotApplicable === true ? 'not_applicable' : 'applicable',
              }
            : {}),
        }
      : {
          ...(hasOwnField(row, 'startAt')
            ? { volunteerApplicationStartDate: row.startAt ?? '' }
            : {}),
          ...(hasOwnField(row, 'endAt')
            ? { volunteerApplicationEndDate: row.endAt ?? '' }
            : {}),
          ...(hasOwnField(row, 'announcementPublished')
            ? {
                volunteerRecruitmentAnnouncementPublished: announcementPublishedToFormValue(
                  row.announcementPublished ?? undefined,
                  values.volunteerRecruitmentAnnouncementPublished ?? 'published'
                ),
              }
            : {}),
          ...(hasOwnField(row, 'noticeExposureTiming') && row.noticeExposureTiming
            ? { volunteerRecruitmentNoticeExposure: row.noticeExposureTiming }
            : {}),
          ...(hasOwnField(row, 'volunteerTargets') && row.volunteerTargets
            ? { volunteerTargets: row.volunteerTargets }
            : {}),
          ...(hasOwnField(row, 'remarksNotApplicable')
            ? {
                volunteerRecruitmentNotesNotApplicable:
                  row.remarksNotApplicable === true ? 'not_applicable' : 'applicable',
              }
            : {}),
          ...(hasOwnField(row, 'documentPassAnnouncementAt')
            ? { documentPassAnnouncementDate: row.documentPassAnnouncementAt ?? '' }
            : {}),
          ...(hasOwnField(row, 'finalPassAnnouncementAt')
            ? { finalPassAnnouncementDate: row.finalPassAnnouncementAt ?? '' }
            : {}),
          ...(hasOwnField(row, 'interviewConfig')
            ? { volunteerInterviewConfig: row.interviewConfig ?? {} }
            : {}),
        }),
  }
}

/**
 * 모집 RHF 값을 해당 recruitment row에만 반영한다.
 * 프로그램 Overlay나 다른 반기 row는 변경하지 않는다.
 */
export function applyUjatRecruitFormValuesToProgram(
  program: Program,
  kind: UjatRecruitDisplayKind,
  values: ProgramDetailEditFormValues,
  options?: { createMissing?: boolean }
): Program {
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  const audience = kind === 'institution' ? 'participant' : 'volunteer'
  const rows = program.programRecruitments ?? []
  const existingTarget =
    audience === 'volunteer' && half
      ? pickUjatVolunteerRecruitmentRow(program, half)
      : pickRecruitmentCopyRow(program, audience, half ?? undefined)
  const hasFormValues = (isInstitution =>
    (isInstitution
      ? [
          values.announcementTitle,
          values.applicationStartDate,
          values.applicationEndDate,
          values.recruitmentContactOrganizationName,
        ]
      : [
          values.announcementTitle,
          values.volunteerApplicationStartDate,
          values.volunteerApplicationEndDate,
          values.volunteerRecruitmentContactOrganizationName,
          values.interviewStartDate,
          values.interviewEndDate,
        ]
    ).some(value => typeof value === 'string' && value.trim() !== ''))(kind === 'institution')
  if (!existingTarget && (!options?.createMissing || !hasFormValues)) return program

  const isInstitution = kind === 'institution'
  const volunteerRoundIndex = half === 'h1' ? 0 : half === 'h2' ? 1 : null
  const volunteerRound =
    volunteerRoundIndex != null ? values.rounds?.[volunteerRoundIndex] : undefined
  const volunteerStartAt =
    volunteerRound?.startDate?.trim() || values.volunteerApplicationStartDate?.trim() || null
  const volunteerEndAt =
    volunteerRound?.endDate?.trim() || values.volunteerApplicationEndDate?.trim() || null
  const contactName = isInstitution
    ? values.recruitmentContactOrganizationName
    : values.volunteerRecruitmentContactOrganizationName
  const target: ProgramRecruitmentWindow = existingTarget ?? {
    recruitmentType: isInstitution ? 'PARTICIPANT' : 'VOLUNTEER',
    targetType: isInstitution ? 'ORGANIZATION' : 'COLLEGE_STUDENT',
    applicationType: isInstitution ? 'ORGANIZATION' : 'VOLUNTEER',
    ...(half === 'h1' ? { recruitTerm: 'FIRST_HALF' as const } : {}),
    ...(half === 'h2' ? { recruitTerm: 'SECOND_HALF' as const } : {}),
  }
  const nextRow: ProgramRecruitmentWindow = {
    ...target,
    announcementTitle: values.announcementTitle?.trim() || null,
    startAt: (isInstitution ? values.applicationStartDate : volunteerStartAt)?.trim() || null,
    endAt: (isInstitution ? values.applicationEndDate : volunteerEndAt)?.trim() || null,
    operationStartDate: toOperationCalendarDate(values.startDate) ?? null,
    operationEndDate: toOperationCalendarDate(values.endDate) ?? null,
    programDescription: values.description?.trim() || null,
    recruitmentGuide: values.recruitmentGuide?.trim() || null,
    applicationMethod: values.applicationMethod?.trim() || null,
    learningSupportContent: values.learningSupportContent?.trim() || null,
    additionalContentHtml: values.additionalContentHtml?.trim() || null,
    contactName: contactName?.trim() || null,
    contactPhone: values.contactPhone?.trim() || null,
    contactEmail: values.contactEmail?.trim() || null,
    ...(isInstitution
      ? {
          remarks: values.oneLineIntroduction?.trim() || null,
          ...typedFieldsFromRecruitmentFormValues(values, 'institution'),
        }
      : {
          otherMatters: values.otherNotes?.trim() || null,
          interviewEnabled: true,
          interviewStartAt: values.interviewStartDate?.trim() || null,
          interviewEndAt: values.interviewEndDate?.trim() || null,
          ...typedFieldsFromRecruitmentFormValues(values, 'volunteer'),
        }),
  }
  return {
    ...program,
    programRecruitments: existingTarget
      ? rows.map(row => (row === existingTarget ? nextRow : row))
      : [...rows, nextRow],
  }
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
  const row =
    (audience === 'volunteer' && half
      ? pickUjatVolunteerRecruitmentRow(program, half)
      : pickRecruitmentCopyRow(program, audience, half)
    )
  if (!row || !hasOwnField(row, 'announcementTitle') || row.announcementTitle === undefined) {
    return undefined
  }
  return row.announcementTitle ?? ''
}

/** 공고용 프로그램명 — GET 행 우선, 없으면 모집 overlay. 공통정보와 공유하지 않는다. */
export function resolveUjatRecruitAnnouncementTitle(
  program: Program,
  kind: UjatRecruitDisplayKind,
  options?: { allowOverlayFallback?: boolean }
): string {
  const fromRow = rowAnnouncementTitle(program, kind)
  if (fromRow !== undefined) return fromRow || '-'
  if (options?.allowOverlayFallback === false) return '-'
  if (kind === 'institution') {
    return (
      overlayString(mergedInstitutionOverlay(program), UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.publicTitle) ||
      '-'
    )
  }
  const overlay = mergedVolunteerOverlay(program)
  const half = volunteerHalfFromRecruitDisplayKind(kind)
  if (half) {
    return (
      overlayString(overlay, ujatVolunteerHalfOverlayKey(half, 'publicTitle')) ||
      '-'
    )
  }
  return (
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
          ...(args.kind === 'institution'
            ? { remarks: args.values.oneLineIntroduction?.trim() || null }
            : { otherMatters: args.values.otherNotes?.trim() || null }),
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
