import type { Program } from '@/types/domain'
import type { DateValue } from '@/types'
import {
  isUjatVolunteerNoticeExposureValue,
  type UjatVolunteerNoticeExposureValue,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { loadUjatRecruitVolunteerTemplateSave } from '@/features/program/lib/ujat-recruit-template-local-save'
type RangeSeal = { start: string | null; end: string | null }
type ResultSeal = { date: string | null; method: string }
type ContactSeal = { name: string; phone: string; email: string }
const KEYS = {
  noticeExposure: 'ujat.recruit.volunteer.noticeExposure',
  publicTitle: 'ujat.recruit.volunteer.publicTitle',
  programRange: 'ujat.recruit.volunteer.programRange',
  targetDetail: 'ujat.recruit.volunteer.targetDetail',
  recruitRange: 'ujat.recruit.volunteer.recruitRange',
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
  attachmentFileNames: 'ujat.recruit.volunteer.attachmentFileNames' } as const
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