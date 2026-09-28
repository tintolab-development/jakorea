import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  buildUjatRecruitInstitutionOverlayFromDetailEditValues,
  pickUjatRecruitInstitutionOverlay,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  buildUjatRecruitVolunteerOverlayFromDetailEditValues,
  pickUjatRecruitVolunteerOverlay,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  resolveVolunteerOverlayForHalf,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import {
  coalesceUjatRecruitOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-overlay-coalesce'
import {
  getUjatRecruitInstitutionOverlayRecord,
  patchUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayRecord,
  patchUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'

const INSTITUTION_KEYS = UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS
const VOLUNTEER_KEYS = UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS

const INSTITUTION_DIRTY_FIELD_KEYS: Record<string, readonly string[]> = {
  announcementTitle: [INSTITUTION_KEYS.publicTitle],
  startDate: [INSTITUTION_KEYS.programRange],
  endDate: [INSTITUTION_KEYS.programRange],
  targetLevels: [INSTITUTION_KEYS.targetLevels],
  district: [INSTITUTION_KEYS.district],
  applicationStartDate: [INSTITUTION_KEYS.recruitRange],
  applicationEndDate: [INSTITUTION_KEYS.recruitRange],
  resultAnnouncementDate: [INSTITUTION_KEYS.resultAnnounce],
  resultAnnouncementMethod: [INSTITUTION_KEYS.resultAnnounce],
  recruitmentContactOrganizationName: [INSTITUTION_KEYS.contact],
  contactPhone: [INSTITUTION_KEYS.contact],
  contactEmail: [INSTITUTION_KEYS.contact],
  oneLineIntroduction: [INSTITUTION_KEYS.notes],
  participantRecruitmentNotesNotApplicable: [INSTITUTION_KEYS.notes],
  participantRecruitmentAnnouncementPublished: [INSTITUTION_KEYS.announcementPublished],
}

const VOLUNTEER_DIRTY_FIELD_KEYS: Record<string, readonly string[]> = {
  announcementTitle: [VOLUNTEER_KEYS.publicTitle],
  startDate: [VOLUNTEER_KEYS.programRange],
  endDate: [VOLUNTEER_KEYS.programRange],
  volunteerTargets: [VOLUNTEER_KEYS.volunteerTargets],
  volunteerTargetDetail: [VOLUNTEER_KEYS.targetDetail],
  volunteerApplicationStartDate: [VOLUNTEER_KEYS.recruitRange, VOLUNTEER_KEYS.recruitRangeH1],
  volunteerApplicationEndDate: [VOLUNTEER_KEYS.recruitRange, VOLUNTEER_KEYS.recruitRangeH1],
  documentPassAnnouncementDate: [VOLUNTEER_KEYS.docAnnounce],
  documentPassAnnouncementMethod: [VOLUNTEER_KEYS.docAnnounce],
  interviewStartDate: [VOLUNTEER_KEYS.interviewRange],
  interviewEndDate: [VOLUNTEER_KEYS.interviewRange],
  interviewMethod: [VOLUNTEER_KEYS.interviewMethod],
  finalPassAnnouncementDate: [VOLUNTEER_KEYS.finalAnnounce],
  finalPassAnnouncementMethod: [VOLUNTEER_KEYS.finalAnnounce],
  resultAnnouncementDate: [VOLUNTEER_KEYS.finalAnnounce],
  resultAnnouncementMethod: [VOLUNTEER_KEYS.finalAnnounce],
  volunteerRecruitmentContactOrganizationName: [VOLUNTEER_KEYS.contact],
  contactPhone: [VOLUNTEER_KEYS.contact],
  contactEmail: [VOLUNTEER_KEYS.contact],
  otherNotes: [VOLUNTEER_KEYS.notes, VOLUNTEER_KEYS.otherNotes],
  volunteerRecruitmentAnnouncementPublished: [VOLUNTEER_KEYS.announcementPublished],
  volunteerRecruitmentNoticeExposure: [VOLUNTEER_KEYS.noticeExposure],
}

function overlayKeysForDirtyFormField(
  kind: 'institution' | 'volunteer',
  name: string
): readonly string[] {
  if (kind === 'institution') {
    return INSTITUTION_DIRTY_FIELD_KEYS[name] ?? []
  }
  if (name.startsWith('rounds.0')) {
    return [VOLUNTEER_KEYS.recruitRange, VOLUNTEER_KEYS.recruitRangeH1, VOLUNTEER_KEYS.activityTermH1]
  }
  if (name.startsWith('rounds.1')) {
    return [VOLUNTEER_KEYS.recruitRangeH2, VOLUNTEER_KEYS.activityTermH2]
  }
  return VOLUNTEER_DIRTY_FIELD_KEYS[name] ?? []
}

/** 빈 폼 값으로 다른 필드를 지우지 않는다. 사용자가 고친 필드만 빈 값 허용. */
export function mergeUjatRecruitFormOverlayPatch(args: {
  existing: Record<string, unknown>
  next: Record<string, unknown>
  dirtyFormField?: string
  kind: 'institution' | 'volunteer'
}): Record<string, unknown> {
  const merged = coalesceUjatRecruitOverlay(args.existing, args.next)
  if (!args.dirtyFormField) return merged
  for (const key of overlayKeysForDirtyFormField(args.kind, args.dirtyFormField)) {
    if (key in args.next) merged[key] = args.next[key]
  }
  return merged
}

function readOverlayContact(overlay: Record<string, unknown>, key: string) {
  const value = overlay[key]
  if (value == null || typeof value !== 'object') return undefined
  return value as { name?: string; phone?: string; email?: string }
}

function readOverlayStringList(overlay: Record<string, unknown>, key: string): string[] | undefined {
  const value = overlay[key]
  if (!Array.isArray(value)) return undefined
  const list = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  return list.length > 0 ? list : undefined
}

function readOverlayRange(overlay: Record<string, unknown>, key: string) {
  const value = overlay[key]
  if (value == null || typeof value !== 'object') return undefined
  return value as { start?: string | null; end?: string | null }
}

/** 탭 복귀 시 공고용 프로그램명이 대표명 alias로 빠지지 않게 overlay 값을 우선한다. */
export function programToUjatRecruitTemplateFormValues(
  program: Program,
  kind: 'institution' | 'volunteer',
  volunteerHalf?: UjatVolunteerRecruitHalf
): ProgramDetailEditFormValues {
  const values = programToDetailEditValues(program)
  const persisted = program.ujatRegistrationOverlay ?? {}
  const overlay =
    kind === 'institution'
      ? {
          ...pickUjatRecruitInstitutionOverlay(persisted),
          ...getUjatRecruitInstitutionOverlayRecord(),
        }
      : resolveVolunteerOverlayForHalf(
          {
            ...getUjatRecruitVolunteerOverlayRecord(),
            ...pickUjatRecruitVolunteerOverlay(persisted),
          },
          volunteerHalf ?? 'h1'
        )
  const publicTitleKey =
    kind === 'institution' ? INSTITUTION_KEYS.publicTitle : VOLUNTEER_KEYS.publicTitle
  const publicTitle = overlay[publicTitleKey]
  const next = { ...values }
  next.announcementTitle = typeof publicTitle === 'string' ? publicTitle.trim() : ''
  if (kind === 'institution') {
    const contact = readOverlayContact(overlay, INSTITUTION_KEYS.contact)
    if (contact?.name?.trim()) next.recruitmentContactOrganizationName = contact.name
    if (contact?.phone?.trim()) next.contactPhone = contact.phone
    if (contact?.email?.trim()) next.contactEmail = contact.email
    const district = overlay[INSTITUTION_KEYS.district]
    if (typeof district === 'string' && district.trim()) next.district = district
    const targetLevels = readOverlayStringList(overlay, INSTITUTION_KEYS.targetLevels)
    if ((!next.targetLevels || next.targetLevels.length === 0) && targetLevels) {
      next.targetLevels = targetLevels as ProgramDetailEditFormValues['targetLevels']
    }
    const programRange = readOverlayRange(overlay, INSTITUTION_KEYS.programRange)
    if (!next.startDate && programRange?.start?.trim()) next.startDate = programRange.start
    if (!next.endDate && programRange?.end?.trim()) next.endDate = programRange.end
    const recruitRange = readOverlayRange(overlay, INSTITUTION_KEYS.recruitRange)
    if (!next.applicationStartDate && recruitRange?.start?.trim()) {
      next.applicationStartDate = recruitRange.start
    }
    if (!next.applicationEndDate && recruitRange?.end?.trim()) {
      next.applicationEndDate = recruitRange.end
    }
    return next
  }
  const contact = readOverlayContact(overlay, VOLUNTEER_KEYS.contact)
  if (contact?.name?.trim()) next.volunteerRecruitmentContactOrganizationName = contact.name
  if (contact?.phone?.trim()) next.contactPhone = contact.phone
  if (contact?.email?.trim()) next.contactEmail = contact.email
  const targetDetail = overlay[VOLUNTEER_KEYS.targetDetail]
  if (typeof targetDetail === 'string' && targetDetail.trim()) {
    next.volunteerTargetDetail = targetDetail
  }
  const volunteerTargets = readOverlayStringList(overlay, VOLUNTEER_KEYS.volunteerTargets)
  if ((!next.volunteerTargets || next.volunteerTargets.length === 0) && volunteerTargets) {
    next.volunteerTargets = volunteerTargets
  }
  const programRange = readOverlayRange(overlay, VOLUNTEER_KEYS.programRange)
  if (!next.startDate && programRange?.start?.trim()) next.startDate = programRange.start
  if (!next.endDate && programRange?.end?.trim()) next.endDate = programRange.end
  const recruitRange =
    readOverlayRange(overlay, VOLUNTEER_KEYS.recruitRangeH1) ??
    readOverlayRange(overlay, VOLUNTEER_KEYS.recruitRange)
  if (!next.volunteerApplicationStartDate && recruitRange?.start?.trim()) {
    next.volunteerApplicationStartDate = recruitRange.start
  }
  if (!next.volunteerApplicationEndDate && recruitRange?.end?.trim()) {
    next.volunteerApplicationEndDate = recruitRange.end
  }
  return next
}

function patchRecruitOverlayFromForm(
  kind: 'institution' | 'volunteer',
  values: ProgramDetailEditFormValues,
  dirtyFormField?: string
): void {
  const next =
    kind === 'institution'
      ? buildUjatRecruitInstitutionOverlayFromDetailEditValues(values)
      : buildUjatRecruitVolunteerOverlayFromDetailEditValues(values)
  const existing =
    kind === 'institution'
      ? getUjatRecruitInstitutionOverlayRecord()
      : getUjatRecruitVolunteerOverlayRecord()
  const merged = mergeUjatRecruitFormOverlayPatch({
    existing,
    next,
    dirtyFormField,
    kind,
  })
  if (kind === 'institution') {
    patchUjatRecruitInstitutionOverlay(merged)
    return
  }
  patchUjatRecruitVolunteerOverlay(merged)
}

/**
 * 양식 작성 RHF → 모집 overlay.
 * 구독 직후 빈 기본값으로 overlay를 덮지 않는다.
 * program은 overlay 키 입력마다 재계산되므로 시드 의존에서 제외한다.
 */
export function useUjatRecruitTemplateFormOverlaySync(
  form: UseFormReturn<ProgramDetailEditFormValues>,
  kind: 'institution' | 'volunteer',
  program: Program,
  _revision: number
): void {
  const readyRef = useRef(false)
  const programRef = useRef(program)
  programRef.current = program

  useEffect(() => {
    readyRef.current = false
    form.reset(programToUjatRecruitTemplateFormValues(programRef.current, kind), {
      keepDefaultValues: false,
    })
    readyRef.current = true
  }, [form, kind])

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (!readyRef.current) return
      if (info.name == null && info.type == null) return
      const dirtyFormField =
        info.type === 'change' || info.type === 'blur' ? info.name : undefined
      patchRecruitOverlayFromForm(kind, values as ProgramDetailEditFormValues, dirtyFormField)
    })
    return () => subscription.unsubscribe()
  }, [form, kind])
}
