import type { Program } from '@/types/domain'
import type { DateValue } from '@/types'
import {
  isUjatVolunteerNoticeExposureValue,
  type UjatVolunteerNoticeExposureValue,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { loadUjatRecruitVolunteerTemplateSave } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
type RangeSeal = { start: string | null; end: string | null }
type ResultSeal = { date: string | null; method: string }
type ContactSeal = { name: string; phone: string; email: string }
export const UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS = {
  announcementPublished: 'ujat.recruit.volunteer.announcementPublished',
  noticeExposure: 'ujat.recruit.volunteer.noticeExposure',
  publicTitle: 'ujat.recruit.volunteer.publicTitle',
  programRange: 'ujat.recruit.volunteer.programRange',
  volunteerTargets: 'ujat.recruit.volunteer.volunteerTargets',
  targetDetail: 'ujat.recruit.volunteer.targetDetail',
  recruitRange: 'ujat.recruit.volunteer.recruitRange',
  recruitRangeH1: 'ujat.recruit.volunteer.h1.recruitRange',
  recruitRangeH2: 'ujat.recruit.volunteer.h2.recruitRange',
  activityTermH1: 'ujat.recruit.volunteer.h1.activityTerm',
  activityTermH2: 'ujat.recruit.volunteer.h2.activityTerm',
  docAnnounce: 'ujat.recruit.volunteer.docAnnounce',
  interviewRange: 'ujat.recruit.volunteer.interviewRange',
  interviewMethod: 'ujat.recruit.volunteer.interviewMethod',
  finalAnnounce: 'ujat.recruit.volunteer.finalAnnounce',
  contact: 'ujat.recruit.volunteer.contact',
  notes: 'ujat.recruit.volunteer.notes',
  description: 'ujat.recruit.volunteer.description',
  recruitmentGuide: 'ujat.recruit.volunteer.recruitmentGuide',
  applicationMethod: 'ujat.recruit.volunteer.applicationMethod',
  otherNotes: 'ujat.recruit.volunteer.otherNotes',
  additionalContentHtml: 'ujat.recruit.volunteer.additionalContentHtml',
  attachmentFileNames: 'ujat.recruit.volunteer.attachmentFileNames',
} as const

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

export function pickUjatRecruitVolunteerOverlay(
  record: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.values(KEYS)) {
    if (record[key] !== undefined) out[key] = record[key]
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

/** 오버레이에 값이 있으면 프로그램 필드를 덮어쓴다. */
export function applyUjatRecruitVolunteerOverlayOntoProgram(
  program: Program,
  overlay: Record<string, unknown>
): Program {
  if (Object.keys(overlay).length === 0) return program
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
  const publicTitle = overlayString(overlay, KEYS.publicTitle)
  const volunteerTargets = overlayStringList(overlay, KEYS.volunteerTargets)
  const announcementPublished = overlay[KEYS.announcementPublished]
  const noticeExposure = overlay[KEYS.noticeExposure]
  const notes =
    overlayString(overlay, KEYS.notes) ?? overlayString(overlay, KEYS.otherNotes)
  return {
    ...program,
    mainTitle: publicTitle ?? program.mainTitle,
    title: publicTitle ?? program.title,
    startDate: programRange?.start?.trim() ? programRange.start : program.startDate,
    endDate: programRange?.end?.trim() ? programRange.end : program.endDate,
    volunteerTarget: volunteerTargets?.join(', ') ?? program.volunteerTarget,
    volunteerTargets: volunteerTargets ?? program.volunteerTargets,
    volunteerTargetDetail:
      overlayString(overlay, KEYS.targetDetail) ?? program.volunteerTargetDetail,
    volunteerApplicationStartDate: recruitRangeH1?.start?.trim()
      ? recruitRangeH1.start
      : program.volunteerApplicationStartDate,
    volunteerApplicationEndDate: recruitRangeH1?.end?.trim()
      ? recruitRangeH1.end
      : program.volunteerApplicationEndDate,
    documentPassAnnouncementDate: docAnnounce?.date?.trim()
      ? docAnnounce.date
      : program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: docAnnounce?.method?.trim()
      ? docAnnounce.method
      : program.documentPassAnnouncementMethod,
    interviewStartDate: interviewRange?.start?.trim()
      ? interviewRange.start
      : program.interviewStartDate,
    interviewEndDate: interviewRange?.end?.trim()
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
    contactPhone: contact?.phone?.trim() ? contact.phone : program.contactPhone,
    contactEmail: contact?.email?.trim() ? contact.email : program.contactEmail,
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
        recruitRangeH1,
        overlayString(overlay, KEYS.activityTermH1)
      ),
      1,
      recruitRangeH2,
      overlayString(overlay, KEYS.activityTermH2)
    ),
    generalCommonInfo: {
      ...program.generalCommonInfo,
      announcementTitle: publicTitle ?? program.generalCommonInfo?.announcementTitle,
      volunteerRecruitmentInfo: {
        ...program.generalCommonInfo?.volunteerRecruitmentInfo,
        announcementPublished:
          typeof announcementPublished === 'boolean'
            ? announcementPublished
            : program.generalCommonInfo?.volunteerRecruitmentInfo?.announcementPublished,
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
export function applyUjatRecruitVolunteerTemplateDefaults(program: Program): Program {
  const saved = loadUjatRecruitVolunteerTemplateSave()
  if (!saved?.overlay || Object.keys(saved.overlay).length === 0) return program
  const overlay = saved.overlay
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
      program.attachmentFileNames?.length ? program.attachmentFileNames : attachmentFileNames }
}