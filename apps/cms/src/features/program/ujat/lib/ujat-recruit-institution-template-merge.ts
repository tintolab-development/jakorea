import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import type { DateValue } from '@/types'
import { loadUjatRecruitInstitutionTemplateSave } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
type RangeSeal = { start: string | null; end: string | null }
type ResultSeal = { date: string | null; method: string }
type ContactSeal = { name: string; phone: string; email: string }
const OVERLAY_KEYS = {
  publicTitle: 'ujat.recruit.institution.publicTitle',
  programRange: 'ujat.recruit.institution.programRange',
  district: 'ujat.recruit.institution.district',
  recruitRange: 'ujat.recruit.institution.recruitRange',
  resultAnnounce: 'ujat.recruit.institution.resultAnnounce',
  contact: 'ujat.recruit.institution.contact',
  notes: 'ujat.recruit.institution.notes',
  description: 'ujat.recruit.institution.description',
  recruitmentGuide: 'ujat.recruit.institution.recruitmentGuide',
  learningSupportContent: 'ujat.recruit.institution.learningSupportContent',
  additionalContentHtml: 'ujat.recruit.institution.additionalContentHtml',
  attachmentFileNames: 'ujat.recruit.institution.attachmentFileNames' } as const
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
/** 저장된 학교 모집 템플릿 오버레이를 프로그램 필드에 병합(프로그램 값이 있으면 우선). */
export function applyUjatRecruitInstitutionTemplateDefaults(program: Program): Program {
  const saved = loadUjatRecruitInstitutionTemplateSave()
  if (!saved?.overlay || Object.keys(saved.overlay).length === 0) return program
  const overlay = saved.overlay
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
    district: coalesceString(program.district, overlayString(overlay, OVERLAY_KEYS.district)),
    applicationStartDate: coalesceIsoDate(
      program.applicationStartDate,
      recruitRange?.start ?? undefined
    ),
    applicationEndDate: coalesceIsoDate(program.applicationEndDate, recruitRange?.end ?? undefined),
    resultAnnouncementDate: coalesceIsoDate(
      program.resultAnnouncementDate,
      result?.date ?? undefined
    ),
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
    return `${dayjs(start).format('YYYY. MM. DD')} ~ ${dayjs(end).format('YYYY. MM. DD')}`
  }
  return start ? dayjs(start).format('YYYY. MM. DD') : end ? dayjs(end).format('YYYY. MM. DD') : undefined
}