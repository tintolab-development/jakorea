import type { Program } from '@/types/domain'
import type { DateValue } from '@/types'
import { announcementPublishedFromFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  isUjatVolunteerNoticeExposureValue,
  type UjatVolunteerNoticeExposureValue,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { loadUjatRecruitVolunteerTemplateSave } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import { UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS } from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'

export { UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS }

type RangeSeal = { start: string | null; end: string | null }
type ResultSeal = { date: string | null; method: string }
type ContactSeal = { name: string; phone: string; email: string }

const KEYS = UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS
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
  return v as RangeSeal
}

function overlayStringList(overlay: Record<string, unknown>, key: string): string[] | undefined {
  const v = overlay[key]
  if (!Array.isArray(v)) return undefined
  const list = v.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  return list.length > 0 ? list : undefined
}

function toRangeSeal(start?: string, end?: string): RangeSeal {
  return {
    start: start?.trim() ? start : null,
    end: end?.trim() ? end : null,
  }
}

/** 모집 정보 RHF → 봉사자 모집 overlay (상세정보·첨부는 건드리지 않음) */
export function buildUjatRecruitVolunteerOverlayFromDetailEditValues(
  values: ProgramDetailEditFormValues
): Record<string, unknown> {
  const h1 = values.rounds?.[0]
  const h2 = values.rounds?.[1]
  const noticeExposure = values.volunteerRecruitmentNoticeExposure
  return {
    [KEYS.announcementPublished]:
      announcementPublishedFromFormValue(values.volunteerRecruitmentAnnouncementPublished) ??
      true,
    ...(isUjatVolunteerNoticeExposureValue(noticeExposure)
      ? { [KEYS.noticeExposure]: noticeExposure }
      : {}),
    [KEYS.publicTitle]: values.announcementTitle?.trim() ?? '',
    [KEYS.programRange]: toRangeSeal(values.startDate, values.endDate),
    [KEYS.volunteerTargets]: values.volunteerTargets ?? [],
    [KEYS.targetDetail]: values.volunteerTargetDetail?.trim() ?? '',
    [KEYS.recruitRange]: toRangeSeal(
      values.volunteerApplicationStartDate,
      values.volunteerApplicationEndDate
    ),
    [KEYS.recruitRangeH1]: toRangeSeal(
      values.volunteerApplicationStartDate,
      values.volunteerApplicationEndDate
    ),
    [KEYS.recruitRangeH2]: toRangeSeal(
      values.volunteerApplicationStartDate,
      values.volunteerApplicationEndDate
    ),
    [KEYS.activityTermH1]: h1?.curriculum?.trim() ?? '',
    [KEYS.activityTermH2]: h2?.curriculum?.trim() ?? '',
    [KEYS.docAnnounce]: {
      date: values.documentPassAnnouncementDate?.trim()
        ? values.documentPassAnnouncementDate
        : null,
      method: values.documentPassAnnouncementMethod?.trim() ?? '',
    },
    [KEYS.interviewRange]: toRangeSeal(values.interviewStartDate, values.interviewEndDate),
    [KEYS.interviewMethod]: values.interviewMethod?.trim() ?? '',
    [KEYS.finalAnnounce]: {
      date: values.finalPassAnnouncementDate?.trim()
        ? values.finalPassAnnouncementDate
        : values.resultAnnouncementDate?.trim()
          ? values.resultAnnouncementDate
          : null,
      method:
        values.finalPassAnnouncementMethod?.trim() ||
        values.resultAnnouncementMethod?.trim() ||
        '',
    },
    [KEYS.contact]: {
      name: values.volunteerRecruitmentContactOrganizationName?.trim() ?? '',
      phone: values.contactPhone?.trim() ?? '',
      email: values.contactEmail?.trim() ?? '',
    },
    [KEYS.notes]:
      values.volunteerRecruitmentNotesNotApplicable === 'not_applicable'
        ? ''
        : (values.otherNotes?.trim() ?? ''),
  }
}

export function pickUjatRecruitVolunteerOverlay(
  record: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (!key.startsWith('ujat.recruit.volunteer.') || value === undefined) continue
    out[key] = value
  }
  return out
}

function applyRoundOverlay(
  rounds: Program['rounds'],
  index: number,
  range: RangeSeal | undefined,
  curriculum: string | undefined
): Program['rounds'] {
  if (!rounds?.length) return rounds
  return rounds.map((round, roundIndex) => {
    if (roundIndex !== index) return round
    return {
      ...round,
      startDate: range?.start?.trim() ? range.start : round.startDate,
      endDate: range?.end?.trim() ? range.end : round.endDate,
      curriculum: curriculum?.trim() ? curriculum : round.curriculum,
    }
  })
}

/** 운영 회차 기간은 유지하고 봉사자 활동 기수(curriculum)만 얹는다. */
export function stampUjatVolunteerActivityTermsOnRounds(
  rounds: Program['rounds'],
  overlay: Record<string, unknown>,
  options?: { preferExisting?: boolean }
): Program['rounds'] {
  if (!rounds?.length) return rounds
  const preferExisting = options?.preferExisting === true
  const h1 = overlayString(overlay, KEYS.activityTermH1)
  const h2 = overlayString(overlay, KEYS.activityTermH2)
  return rounds.map((round, index) => {
    const incoming =
      round.roundNumber === 2 || (round.roundNumber == null && index === 1) ? h2 : h1
    const next =
      preferExisting && round.curriculum?.trim()
        ? round.curriculum
        : incoming?.trim() || round.curriculum
    if (next === round.curriculum) return round
    return { ...round, curriculum: next }
  })
}

export function resolveUjatVolunteerActivityTermFromOverlay(
  overlay: Record<string, unknown>,
  half: 'h1' | 'h2'
): string | undefined {
  const key = half === 'h1' ? KEYS.activityTermH1 : KEYS.activityTermH2
  return overlayString(overlay, key)?.trim() || undefined
}

/** 오버레이에 값이 있으면 프로그램 필드를 덮어쓴다. GET 행이 있으면 기간·문의처·면접은 덮지 않는다. */
export function applyUjatRecruitVolunteerOverlayOntoProgram(
  program: Program,
  overlay: Record<string, unknown>,
  options?: { preferOverlay?: boolean }
): Program {
  if (Object.keys(overlay).length === 0) return program
  const preferOverlay = options?.preferOverlay !== false
  const programRange = readRangeSeal(overlay, KEYS.programRange)
  const recruitRange = readRangeSeal(overlay, KEYS.recruitRange)
  const recruitRangeH1 = readRangeSeal(overlay, KEYS.recruitRangeH1) ?? recruitRange
  const recruitRangeH2 = readRangeSeal(overlay, KEYS.recruitRangeH2) ?? recruitRange
  const interviewRange = readRangeSeal(overlay, KEYS.interviewRange)
  const docAnnounce = overlay[KEYS.docAnnounce] as ResultSeal | undefined
  const finalAnnounce = overlay[KEYS.finalAnnounce] as ResultSeal | undefined
  const contact = overlay[KEYS.contact] as ContactSeal | undefined
  const attachments = overlay[KEYS.attachmentFileNames]
  const attachmentFileNames = Array.isArray(attachments)
    ? attachments.filter((x): x is string => typeof x === 'string')
    : undefined
  const volunteerTargets = overlayStringList(overlay, KEYS.volunteerTargets)
  const announcementPublished = overlay[KEYS.announcementPublished]
  const noticeExposure = overlay[KEYS.noticeExposure]
  const notes =
    overlayString(overlay, KEYS.notes) ?? overlayString(overlay, KEYS.otherNotes)
  return {
    ...program,
    mainTitle: program.mainTitle,
    title: program.title,
    startDate:
      preferOverlay && programRange?.start?.trim() ? programRange.start : program.startDate,
    endDate: preferOverlay && programRange?.end?.trim() ? programRange.end : program.endDate,
    volunteerTarget: volunteerTargets?.join(', ') ?? program.volunteerTarget,
    volunteerTargets: volunteerTargets ?? program.volunteerTargets,
    volunteerTargetDetail:
      overlayString(overlay, KEYS.targetDetail) ?? program.volunteerTargetDetail,
    volunteerApplicationStartDate:
      preferOverlay && recruitRangeH1?.start?.trim()
        ? recruitRangeH1.start
        : program.volunteerApplicationStartDate,
    volunteerApplicationEndDate:
      preferOverlay && recruitRangeH1?.end?.trim()
        ? recruitRangeH1.end
        : program.volunteerApplicationEndDate,
    documentPassAnnouncementDate: docAnnounce?.date?.trim()
      ? docAnnounce.date
      : program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: docAnnounce?.method?.trim()
      ? docAnnounce.method
      : program.documentPassAnnouncementMethod,
    interviewStartDate:
      preferOverlay && interviewRange?.start?.trim()
        ? interviewRange.start
        : program.interviewStartDate,
    interviewEndDate:
      preferOverlay && interviewRange?.end?.trim()
        ? interviewRange.end
        : program.interviewEndDate,
    interviewMethod:
      overlayString(overlay, KEYS.interviewMethod) ?? program.interviewMethod,
    finalPassAnnouncementDate: finalAnnounce?.date?.trim()
      ? finalAnnounce.date
      : program.finalPassAnnouncementDate,
    finalPassAnnouncementMethod: finalAnnounce?.method?.trim()
      ? finalAnnounce.method
      : program.finalPassAnnouncementMethod,
    managerName:
      preferOverlay && contact?.name?.trim() ? contact.name : program.managerName,
    contactPhone:
      preferOverlay && contact?.phone?.trim() ? contact.phone : program.contactPhone,
    contactEmail:
      preferOverlay && contact?.email?.trim() ? contact.email : program.contactEmail,
    otherNotes: notes ?? program.otherNotes,
    description: overlayString(overlay, KEYS.description) ?? program.description,
    recruitmentGuide:
      overlayString(overlay, KEYS.recruitmentGuide) ?? program.recruitmentGuide,
    applicationMethod:
      overlayString(overlay, KEYS.applicationMethod) ?? program.applicationMethod,
    additionalContentHtml:
      overlayString(overlay, KEYS.additionalContentHtml) ?? program.additionalContentHtml,
    attachmentFileNames: attachmentFileNames ?? program.attachmentFileNames,
    rounds: applyRoundOverlay(
      applyRoundOverlay(
        program.rounds,
        0,
        preferOverlay ? recruitRangeH1 : undefined,
        overlayString(overlay, KEYS.activityTermH1)
      ),
      1,
      preferOverlay ? recruitRangeH2 : undefined,
      overlayString(overlay, KEYS.activityTermH2)
    ),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      volunteerRecruitmentInfo: {
        ...program.generalCommonInfo?.volunteerRecruitmentInfo,
        announcementPublished:
          typeof announcementPublished === 'boolean'
            ? announcementPublished
            : program.generalCommonInfo?.volunteerRecruitmentInfo?.announcementPublished,
        contactOrganizationName:
          (preferOverlay ? contact?.name?.trim() : undefined) ||
          program.generalCommonInfo?.volunteerRecruitmentInfo?.contactOrganizationName,
        noticeExposureTiming: (() => {
          const raw = typeof noticeExposure === 'string' ? noticeExposure : undefined
          return isUjatVolunteerNoticeExposureValue(raw)
            ? raw
            : program.generalCommonInfo?.volunteerRecruitmentInfo?.noticeExposureTiming
        })(),
        notesNotApplicable: false,
      },
    },
  }
}
export function getUjatRecruitVolunteerNoticeExposureFromTemplate(): UjatVolunteerNoticeExposureValue | undefined {
  const saved = loadUjatRecruitVolunteerTemplateSave()
  if (!saved?.overlay) return undefined
  const raw = saved.overlay[KEYS.noticeExposure]
  return isUjatVolunteerNoticeExposureValue(typeof raw === 'string' ? raw : undefined)
    ? (raw as UjatVolunteerNoticeExposureValue)
    : undefined
}
/** 저장된 봉사자 모집 템플릿 오버레이를 프로그램 필드에 병합(프로그램 값이 있으면 우선). */
export function applyUjatRecruitVolunteerTemplateDefaults(
  program: Program,
  extraOverlay?: Record<string, unknown>
): Program {
  const saved = loadUjatRecruitVolunteerTemplateSave()
  const typed = saved?.settingsJson?.ujatRecruitment
  const typedRecruitment =
    typed != null && typeof typed === 'object' && !Array.isArray(typed)
      ? (typed as {
          volunteerH1?: Partial<ProgramDetailEditFormValues>
          volunteerH2?: Partial<ProgramDetailEditFormValues>
        })
      : undefined
  const typedValues = typedRecruitment?.volunteerH2 ?? typedRecruitment?.volunteerH1
  const typedOverlay = typedValues
    ? buildUjatRecruitVolunteerOverlayFromDetailEditValues(
        typedValues as ProgramDetailEditFormValues
      )
    : {}
  const overlay = { ...(extraOverlay ?? {}), ...(saved?.overlay ?? {}), ...typedOverlay }
  if (Object.keys(overlay).length === 0) return program
  const programRange = readRangeSeal(overlay, KEYS.programRange)
  const recruitRange = readRangeSeal(overlay, KEYS.recruitRange)
  const interviewRange = readRangeSeal(overlay, KEYS.interviewRange)
  const docAnnounce = overlay[KEYS.docAnnounce] as ResultSeal | undefined
  const finalAnnounce = overlay[KEYS.finalAnnounce] as ResultSeal | undefined
  const contact = overlay[KEYS.contact] as ContactSeal | undefined
  const attachments = overlay[KEYS.attachmentFileNames]
  const attachmentFileNames = Array.isArray(attachments)
    ? attachments.filter((x): x is string => typeof x === 'string')
    : program.attachmentFileNames
  return {
    ...program,
    mainTitle: coalesceString(program.mainTitle, overlayString(overlay, KEYS.publicTitle)),
    title: coalesceString(program.title, overlayString(overlay, KEYS.publicTitle)) ?? program.title,
    startDate: coalesceIsoDate(program.startDate, programRange?.start ?? undefined) ?? program.startDate,
    endDate: coalesceIsoDate(program.endDate, programRange?.end ?? undefined) ?? program.endDate,
    volunteerTargets:
      program.volunteerTargets?.length
        ? program.volunteerTargets
        : (overlayStringList(overlay, KEYS.volunteerTargets) ?? program.volunteerTargets),
    volunteerTarget:
      program.volunteerTarget?.trim() ||
      overlayStringList(overlay, KEYS.volunteerTargets)?.join(', ') ||
      program.volunteerTarget,
    volunteerTargetDetail: coalesceString(
      program.volunteerTargetDetail,
      overlayString(overlay, KEYS.targetDetail)
    ),
    volunteerApplicationStartDate: coalesceIsoDate(
      program.volunteerApplicationStartDate,
      recruitRange?.start ?? undefined
    ),
    volunteerApplicationEndDate: coalesceIsoDate(
      program.volunteerApplicationEndDate,
      recruitRange?.end ?? undefined
    ),
    documentPassAnnouncementDate: coalesceIsoDate(
      program.documentPassAnnouncementDate,
      docAnnounce?.date ?? undefined
    ),
    documentPassAnnouncementMethod: coalesceString(
      program.documentPassAnnouncementMethod,
      docAnnounce?.method
    ),
    interviewStartDate: coalesceIsoDate(
      program.interviewStartDate,
      interviewRange?.start ?? undefined
    ),
    interviewEndDate: coalesceIsoDate(program.interviewEndDate, interviewRange?.end ?? undefined),
    interviewMethod: coalesceString(
      program.interviewMethod,
      overlayString(overlay, KEYS.interviewMethod)
    ),
    finalPassAnnouncementDate: coalesceIsoDate(
      program.finalPassAnnouncementDate ?? program.resultAnnouncementDate,
      finalAnnounce?.date ?? undefined
    ),
    finalPassAnnouncementMethod: coalesceString(
      program.finalPassAnnouncementMethod ?? program.resultAnnouncementMethod,
      finalAnnounce?.method
    ),
    contactPhone: coalesceString(program.contactPhone, contact?.phone),
    contactEmail: coalesceString(program.contactEmail, contact?.email),
    otherNotes: coalesceString(
      program.otherNotes ?? program.oneLineIntroduction,
      overlayString(overlay, KEYS.notes) ?? overlayString(overlay, KEYS.otherNotes)
    ),
    description: coalesceString(program.description, overlayString(overlay, KEYS.description)),
    recruitmentGuide: coalesceString(
      program.recruitmentGuide,
      overlayString(overlay, KEYS.recruitmentGuide)
    ),
    applicationMethod: coalesceString(
      program.applicationMethod,
      overlayString(overlay, KEYS.applicationMethod)
    ),
    additionalContentHtml: coalesceString(
      program.additionalContentHtml,
      overlayString(overlay, KEYS.additionalContentHtml)
    ),
    attachmentFileNames:
      program.attachmentFileNames?.length ? program.attachmentFileNames : attachmentFileNames,
    rounds: stampUjatVolunteerActivityTermsOnRounds(program.rounds, overlay, {
      preferExisting: true,
    }),
  }
}
