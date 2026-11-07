import { formatDateDot, formatDateRangeDot } from '@/shared/utils/date'
import type { Program } from '@/types/domain'
import type { DateValue } from '@/types'
import { announcementPublishedFromFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { loadUjatRecruitInstitutionTemplateSave } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import { UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { coalesceResultAnnouncementDate } from '@/features/program/shared/lib/resolve-result-announcement-date'

export { UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS }

type RangeSeal = { start: string | null; end: string | null }
type ResultSeal = { date: string | null; method: string }
type ContactSeal = { name: string; phone: string; email: string }

const OVERLAY_KEYS = UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS
function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  return typeof v === 'string' ? v : undefined
}
function coalesceString(programVal: string | undefined, templateVal: string | undefined): string | undefined {
  const trimmed = programVal?.trim()
  if (trimmed) return programVal
  const t = templateVal?.trim()
  return t ? templateVal : programVal
}
function coalesceIsoDate(
  programVal: DateValue | undefined,
  templateIso: string | null | undefined
): DateValue | undefined {
  if (programVal != null && String(programVal).trim() !== '') return programVal
  if (templateIso?.trim()) return templateIso
  return programVal
}
function readRangeSeal(overlay: Record<string, unknown>, key: string): RangeSeal | undefined {
  const v = overlay[key]
  if (!v || typeof v !== 'object') return undefined
  const o = v as RangeSeal
  return o
}

function overlayStringList(overlay: Record<string, unknown>, key: string): string[] | undefined {
  const v = overlay[key]
  if (!Array.isArray(v)) return undefined
  const list = v.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  return list.length > 0 ? list : undefined
}

function toRangeSeal(start?: string | Date, end?: string | Date): RangeSeal {
  const startText = start == null ? '' : String(start).trim()
  const endText = end == null ? '' : String(end).trim()
  return {
    start: startText ? startText : null,
    end: endText ? endText : null,
  }
}

/** 중첩·컬럼 → 기관 모집 overlay. leftover 기간·대상·문의처를 덮는다. */
export function buildUjatRecruitInstitutionOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const participant = program.generalCommonInfo?.participantRecruitmentInfo
  const contactName =
    participant?.contactOrganizationName?.trim() ||
    participant?.contactName?.trim() ||
    program.contactName?.trim() ||
    ''
  return {
    [OVERLAY_KEYS.publicTitle]:
      program.generalCommonInfo?.announcementTitle?.trim() || '',
    [OVERLAY_KEYS.programRange]: toRangeSeal(program.startDate, program.endDate),
    [OVERLAY_KEYS.targetLevels]: program.targetLevels ?? [],
    [OVERLAY_KEYS.district]:
      program.district?.trim() ||
      program.educationTargetDetail?.trim() ||
      participant?.educationTargetDetail?.trim() ||
      '',
    [OVERLAY_KEYS.recruitRange]: toRangeSeal(
      program.applicationStartDate,
      program.applicationEndDate
    ),
    [OVERLAY_KEYS.resultAnnounce]: {
      date: program.resultAnnouncementDate
        ? String(program.resultAnnouncementDate)
        : null,
      method: program.resultAnnouncementMethod?.trim() ?? '',
    },
    [OVERLAY_KEYS.contact]: {
      name: contactName,
      phone: participant?.inquiryTel?.trim() || program.contactPhone?.trim() || '',
      email: participant?.inquiryEmail?.trim() || program.contactEmail?.trim() || '',
    },
    [OVERLAY_KEYS.notes]: participant?.remarks?.trim() || '',
    [OVERLAY_KEYS.description]:
      participant?.programDescription?.trim() || program.description?.trim() || '',
    [OVERLAY_KEYS.recruitmentGuide]:
      participant?.recruitmentGuide?.trim() || program.recruitmentGuide?.trim() || '',
    [OVERLAY_KEYS.applicationMethod]:
      participant?.applicationMethod?.trim() || program.applicationMethod?.trim() || '',
    [OVERLAY_KEYS.learningSupportContent]:
      participant?.learningSupportContent?.trim() ||
      program.learningSupportContent?.trim() ||
      '',
    [OVERLAY_KEYS.additionalContentHtml]:
      participant?.additionalContentHtml?.trim() ||
      program.additionalContentHtml?.trim() ||
      '',
  }
}

/** 모집 정보 RHF → 학교 모집 overlay (상세정보·첨부는 건드리지 않음) */
export function buildUjatRecruitInstitutionOverlayFromDetailEditValues(
  values: ProgramDetailEditFormValues
): Record<string, unknown> {
  return {
    [OVERLAY_KEYS.announcementPublished]:
      announcementPublishedFromFormValue(values.participantRecruitmentAnnouncementPublished) ??
      true,
    [OVERLAY_KEYS.publicTitle]: values.announcementTitle?.trim() ?? '',
    [OVERLAY_KEYS.programRange]: toRangeSeal(values.startDate, values.endDate),
    [OVERLAY_KEYS.targetLevels]: values.targetLevels ?? [],
    [OVERLAY_KEYS.district]:
      values.educationTargetDetail?.trim() || values.district?.trim() || '',
    [OVERLAY_KEYS.recruitRange]: toRangeSeal(
      values.applicationStartDate,
      values.applicationEndDate
    ),
    [OVERLAY_KEYS.resultAnnounce]: {
      date: values.resultAnnouncementDate?.trim() ? values.resultAnnouncementDate : null,
      method: values.resultAnnouncementMethod?.trim() ?? '',
    },
    [OVERLAY_KEYS.contact]: {
      name: values.recruitmentContactOrganizationName?.trim() ?? '',
      phone: values.contactPhone?.trim() ?? '',
      email: values.contactEmail?.trim() ?? '',
    },
    [OVERLAY_KEYS.notes]:
      values.participantRecruitmentNotesNotApplicable === 'not_applicable'
        ? ''
        : (values.oneLineIntroduction?.trim() ?? ''),
    [OVERLAY_KEYS.description]: values.description?.trim() ?? '',
    [OVERLAY_KEYS.recruitmentGuide]: values.recruitmentGuide?.trim() ?? '',
    [OVERLAY_KEYS.applicationMethod]: values.applicationMethod?.trim() ?? '',
    [OVERLAY_KEYS.learningSupportContent]: values.learningSupportContent?.trim() ?? '',
    [OVERLAY_KEYS.additionalContentHtml]: values.additionalContentHtml?.trim() ?? '',
  }
}

export function pickUjatRecruitInstitutionOverlay(
  record: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.values(OVERLAY_KEYS)) {
    if (record[key] !== undefined) out[key] = record[key]
  }
  return out
}

/** 오버레이에 값이 있으면 프로그램 필드를 덮어쓴다. GET 행이 있으면 기간·문의처는 덮지 않는다. */
export function applyUjatRecruitInstitutionOverlayOntoProgram(
  program: Program,
  overlay: Record<string, unknown>,
  options?: { preferOverlay?: boolean }
): Program {
  if (Object.keys(overlay).length === 0) return program
  const preferOverlay = options?.preferOverlay !== false
  const programRange = readRangeSeal(overlay, OVERLAY_KEYS.programRange)
  const recruitRange = readRangeSeal(overlay, OVERLAY_KEYS.recruitRange)
  const result = overlay[OVERLAY_KEYS.resultAnnounce] as ResultSeal | undefined
  const contact = overlay[OVERLAY_KEYS.contact] as ContactSeal | undefined
  const attachments = overlay[OVERLAY_KEYS.attachmentFileNames]
  const attachmentFileNames = Array.isArray(attachments)
    ? attachments.filter((x): x is string => typeof x === 'string')
    : undefined
  const targetLevels = overlayStringList(overlay, OVERLAY_KEYS.targetLevels)
  const district = overlayString(overlay, OVERLAY_KEYS.district)
  const notes = overlayString(overlay, OVERLAY_KEYS.notes)
  const announcementPublished = overlay[OVERLAY_KEYS.announcementPublished]
  return {
    ...program,
    mainTitle: program.mainTitle,
    title: program.title,
    startDate:
      preferOverlay && programRange?.start?.trim() ? programRange.start : program.startDate,
    endDate: preferOverlay && programRange?.end?.trim() ? programRange.end : program.endDate,
    targetLevel: (targetLevels?.[0] as Program['targetLevel']) ?? program.targetLevel,
    targetLevels: (targetLevels as Program['targetLevels']) ?? program.targetLevels,
    district: program.district,
    educationTargetDetail: district ?? program.educationTargetDetail,
    applicationStartDate:
      preferOverlay && recruitRange?.start?.trim()
        ? recruitRange.start
        : program.applicationStartDate,
    applicationEndDate:
      preferOverlay && recruitRange?.end?.trim() ? recruitRange.end : program.applicationEndDate,
    resultAnnouncementDate: coalesceResultAnnouncementDate({
      overlayIso: result?.date,
      programDate: program.resultAnnouncementDate,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      preferOverlay,
    }),
    resultAnnouncementMethod: result?.method?.trim()
      ? result.method
      : program.resultAnnouncementMethod,
    managerName:
      preferOverlay && contact?.name?.trim() ? contact.name : program.managerName,
    contactPhone:
      preferOverlay && contact?.phone?.trim() ? contact.phone : program.contactPhone,
    contactEmail:
      preferOverlay && contact?.email?.trim() ? contact.email : program.contactEmail,
    oneLineIntroduction: notes ?? program.oneLineIntroduction,
    description:
      overlayString(overlay, OVERLAY_KEYS.description) ?? program.description,
    recruitmentGuide:
      overlayString(overlay, OVERLAY_KEYS.recruitmentGuide) ?? program.recruitmentGuide,
    applicationMethod:
      overlayString(overlay, OVERLAY_KEYS.applicationMethod) ?? program.applicationMethod,
    learningSupportContent:
      overlayString(overlay, OVERLAY_KEYS.learningSupportContent) ??
      program.learningSupportContent,
    additionalContentHtml:
      overlayString(overlay, OVERLAY_KEYS.additionalContentHtml) ??
      program.additionalContentHtml,
    attachmentFileNames: attachmentFileNames ?? program.attachmentFileNames,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      participantRecruitmentInfo: {
        ...program.generalCommonInfo?.participantRecruitmentInfo,
        announcementPublished:
          typeof announcementPublished === 'boolean'
            ? announcementPublished
            : program.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished,
        contactOrganizationName:
          (preferOverlay ? contact?.name?.trim() : undefined) ||
          program.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName,
        notesNotApplicable: false,
      },
    },
  }
}

/** 저장된 학교 모집 템플릿 오버레이를 프로그램 필드에 병합(프로그램 값이 있으면 우선). */
export function applyUjatRecruitInstitutionTemplateDefaults(program: Program): Program {
  const saved = loadUjatRecruitInstitutionTemplateSave()
  const typed = saved?.settingsJson?.ujatRecruitment
  const typedInstitution =
    typed != null && typeof typed === 'object' && !Array.isArray(typed)
      ? (typed as { institution?: Partial<ProgramDetailEditFormValues> }).institution
      : undefined
  const typedOverlay = typedInstitution
    ? buildUjatRecruitInstitutionOverlayFromDetailEditValues(
        typedInstitution as ProgramDetailEditFormValues
      )
    : {}
  const overlay = { ...(saved?.overlay ?? {}), ...typedOverlay }
  if (Object.keys(overlay).length === 0) return program
  const programRange = readRangeSeal(overlay, OVERLAY_KEYS.programRange)
  const recruitRange = readRangeSeal(overlay, OVERLAY_KEYS.recruitRange)
  const result = overlay[OVERLAY_KEYS.resultAnnounce] as ResultSeal | undefined
  const contact = overlay[OVERLAY_KEYS.contact] as ContactSeal | undefined
  const attachments = overlay[OVERLAY_KEYS.attachmentFileNames]
  const attachmentFileNames = Array.isArray(attachments)
    ? attachments.filter((x): x is string => typeof x === 'string')
    : program.attachmentFileNames
  return {
    ...program,
    mainTitle: coalesceString(program.mainTitle, overlayString(overlay, OVERLAY_KEYS.publicTitle)),
    title: coalesceString(program.title, overlayString(overlay, OVERLAY_KEYS.publicTitle)) ?? program.title,
    startDate: coalesceIsoDate(program.startDate, programRange?.start ?? undefined) ?? program.startDate,
    endDate: coalesceIsoDate(program.endDate, programRange?.end ?? undefined) ?? program.endDate,
    targetLevels: (() => {
      const fromOverlay = overlayStringList(overlay, OVERLAY_KEYS.targetLevels) as
        | Program['targetLevels']
        | undefined
      const fromProgram = program.targetLevels
      if ((fromOverlay?.length ?? 0) > (fromProgram?.length ?? 0)) return fromOverlay
      return fromProgram?.length ? fromProgram : fromOverlay
    })(),
    targetLevel:
      program.targetLevel ??
      ((overlayStringList(overlay, OVERLAY_KEYS.targetLevels)?.[0] as Program['targetLevel']) ??
        program.targetLevel),
    district: coalesceString(program.district, overlayString(overlay, OVERLAY_KEYS.district)),
    applicationStartDate: coalesceIsoDate(
      program.applicationStartDate,
      recruitRange?.start ?? undefined
    ),
    applicationEndDate: coalesceIsoDate(program.applicationEndDate, recruitRange?.end ?? undefined),
    resultAnnouncementDate: coalesceResultAnnouncementDate({
      overlayIso: result?.date,
      programDate: program.resultAnnouncementDate,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      preferOverlay: false,
    }),
    resultAnnouncementMethod: coalesceString(
      program.resultAnnouncementMethod,
      result?.method
    ),
    contactPhone: coalesceString(program.contactPhone, contact?.phone),
    contactEmail: coalesceString(program.contactEmail, contact?.email),
    oneLineIntroduction: coalesceString(
      program.oneLineIntroduction,
      overlayString(overlay, OVERLAY_KEYS.notes)
    ),
    description: coalesceString(program.description, overlayString(overlay, OVERLAY_KEYS.description)),
    recruitmentGuide: coalesceString(
      program.recruitmentGuide,
      overlayString(overlay, OVERLAY_KEYS.recruitmentGuide)
    ),
    applicationMethod: coalesceString(
      program.applicationMethod,
      overlayString(overlay, OVERLAY_KEYS.applicationMethod)
    ),
    learningSupportContent: coalesceString(
      program.learningSupportContent,
      overlayString(overlay, OVERLAY_KEYS.learningSupportContent)
    ),
    additionalContentHtml: coalesceString(
      program.additionalContentHtml,
      overlayString(overlay, OVERLAY_KEYS.additionalContentHtml)
    ),
    attachmentFileNames:
      program.attachmentFileNames?.length ? program.attachmentFileNames : attachmentFileNames }
}
export function formatUjatRecruitInstitutionTemplatePreviewDates(
  start?: string,
  end?: string
): string | undefined {
  if (!start && !end) return undefined
  if (start && end) {
    const range = formatDateRangeDot(start, end)
    return range === '-' ? undefined : range
  }
  const single = formatDateDot(start ?? end)
  return single === '-' ? undefined : single
}
