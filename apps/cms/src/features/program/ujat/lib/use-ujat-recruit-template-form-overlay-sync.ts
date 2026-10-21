import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { normalizeVolunteerTargetList } from '@/features/program/shared/lib/program-detail-info-constants'
import { hasRecruitmentCopy, pickRecruitmentCopyRow } from '@/features/program/shared/lib/recruitment-row-copy'
import { pickUjatVolunteerRecruitmentRow } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import {
  buildUjatRecruitInstitutionOverlayFromDetailEditValues,
  pickUjatRecruitInstitutionOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  buildUjatRecruitVolunteerOverlayFromDetailEditValues,
  pickUjatRecruitVolunteerOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import { isOperationalSeedDefaultSuppressed } from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'
import {
  blankUjatVolunteerRecruitProgramFields,
  buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues,
  resolveVolunteerOverlayForHalf,
  ujatVolunteerHalfOverlayKey,
  ujatVolunteerRecruitInterviewRangeSealKey,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import {
  coalesceUjatRecruitOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-overlay-coalesce'
import { patchGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
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
  applicationMethod: [INSTITUTION_KEYS.applicationMethod],
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

function remapVolunteerDirtyKeyToHalf(
  key: string,
  half: UjatVolunteerRecruitHalf
): string {
  const fieldByLegacy = Object.entries({
    publicTitle: VOLUNTEER_KEYS.publicTitle,
    announcementPublished: VOLUNTEER_KEYS.announcementPublished,
    noticeExposure: VOLUNTEER_KEYS.noticeExposure,
    programRange: VOLUNTEER_KEYS.programRange,
    volunteerTargets: VOLUNTEER_KEYS.volunteerTargets,
    targetDetail: VOLUNTEER_KEYS.targetDetail,
    docAnnounce: VOLUNTEER_KEYS.docAnnounce,
    interviewRange: VOLUNTEER_KEYS.interviewRange,
    interviewMethod: VOLUNTEER_KEYS.interviewMethod,
    finalAnnounce: VOLUNTEER_KEYS.finalAnnounce,
    contact: VOLUNTEER_KEYS.contact,
    notes: VOLUNTEER_KEYS.notes,
    description: VOLUNTEER_KEYS.description,
    recruitmentGuide: VOLUNTEER_KEYS.recruitmentGuide,
    applicationMethod: VOLUNTEER_KEYS.applicationMethod,
    otherNotes: VOLUNTEER_KEYS.otherNotes,
  } as const).find(([, legacy]) => legacy === key)
  if (fieldByLegacy) {
    return ujatVolunteerHalfOverlayKey(
      half,
      fieldByLegacy[0] as Parameters<typeof ujatVolunteerHalfOverlayKey>[1]
    )
  }
  if (
    key === VOLUNTEER_KEYS.recruitRange ||
    key === VOLUNTEER_KEYS.recruitRangeH1 ||
    key === VOLUNTEER_KEYS.recruitRangeH2
  ) {
    return half === 'h1' ? VOLUNTEER_KEYS.recruitRangeH1 : VOLUNTEER_KEYS.recruitRangeH2
  }
  if (key === VOLUNTEER_KEYS.activityTermH1 || key === VOLUNTEER_KEYS.activityTermH2) {
    return half === 'h1' ? VOLUNTEER_KEYS.activityTermH1 : VOLUNTEER_KEYS.activityTermH2
  }
  return key
}

function overlayKeysForDirtyFormField(
  kind: 'institution' | 'volunteer',
  name: string,
  volunteerHalf?: UjatVolunteerRecruitHalf
): readonly string[] {
  if (kind === 'institution') {
    return INSTITUTION_DIRTY_FIELD_KEYS[name] ?? []
  }
  const sharedKeys = name.startsWith('rounds.0')
    ? [VOLUNTEER_KEYS.recruitRange, VOLUNTEER_KEYS.recruitRangeH1, VOLUNTEER_KEYS.activityTermH1]
    : name.startsWith('rounds.1')
      ? [VOLUNTEER_KEYS.recruitRangeH2, VOLUNTEER_KEYS.activityTermH2]
      : (VOLUNTEER_DIRTY_FIELD_KEYS[name] ?? [])
  if (volunteerHalf == null) return sharedKeys
  return sharedKeys.map(key => remapVolunteerDirtyKeyToHalf(key, volunteerHalf))
}

/** 빈 폼 값으로 다른 필드를 지우지 않는다. 사용자가 고친 필드만 빈 값 허용. */
export function mergeUjatRecruitFormOverlayPatch(args: {
  existing: Record<string, unknown>
  next: Record<string, unknown>
  dirtyFormField?: string
  kind: 'institution' | 'volunteer'
  volunteerHalf?: UjatVolunteerRecruitHalf
}): Record<string, unknown> {
  const merged = coalesceUjatRecruitOverlay(args.existing, args.next)
  if (!args.dirtyFormField) return merged
  for (const key of overlayKeysForDirtyFormField(
    args.kind,
    args.dirtyFormField,
    args.volunteerHalf
  )) {
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
  const volunteerRow =
    kind === 'volunteer'
      ? pickUjatVolunteerRecruitmentRow(program, volunteerHalf ?? 'h1')
      : undefined
  const values = programToDetailEditValues(
    kind === 'volunteer'
      ? applyUjatRecruitVolunteerOverlayOntoProgram(
          blankUjatVolunteerRecruitProgramFields(program),
          overlay,
          { preferOverlay: volunteerRow == null }
        )
      : program
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
    if (targetLevels && targetLevels.length > (next.targetLevels?.length ?? 0)) {
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
    const applicationMethod = overlay[INSTITUTION_KEYS.applicationMethod]
    if (typeof applicationMethod === 'string') next.applicationMethod = applicationMethod
    return applyUjatRecruitmentRowCopyToForm(next, program, 'institution')
  }
  const contact = readOverlayContact(overlay, VOLUNTEER_KEYS.contact)
  if (contact?.name?.trim()) next.volunteerRecruitmentContactOrganizationName = contact.name
  if (contact?.phone?.trim()) next.contactPhone = contact.phone
  if (contact?.email?.trim()) next.contactEmail = contact.email
  const targetDetail = overlay[VOLUNTEER_KEYS.targetDetail]
  if (typeof targetDetail === 'string' && targetDetail.trim()) {
    next.volunteerTargetDetail = targetDetail
  }
  const activityTermKey =
    volunteerHalf === 'h2' ? VOLUNTEER_KEYS.activityTermH2 : VOLUNTEER_KEYS.activityTermH1
  const activityTerm = overlay[activityTermKey]
  const roundIndex = volunteerHalf === 'h2' ? 1 : 0
  if (typeof activityTerm === 'string' && activityTerm.trim() && next.rounds?.[roundIndex]) {
    next.rounds = next.rounds.map((round, index) =>
      index === roundIndex ? { ...round, curriculum: activityTerm.trim() } : round
    )
  }
  if (volunteerHalf === 'h2') {
    const noticeExposure = overlay[VOLUNTEER_KEYS.noticeExposure]
    if (typeof noticeExposure === 'string' && noticeExposure.trim()) {
      next.volunteerRecruitmentNoticeExposure = noticeExposure as
        | 'start-day'
        | 'one-day-before'
        | 'one-week-before'
    }
  }
  const volunteerTargets = readOverlayStringList(overlay, VOLUNTEER_KEYS.volunteerTargets)
  if (Array.isArray(overlay[VOLUNTEER_KEYS.volunteerTargets])) {
    next.volunteerTargets = normalizeVolunteerTargetList(volunteerTargets ?? [])
  } else if (!next.volunteerTargets?.length) {
    // 반기 overlay에 모집 대상 키가 없을 때만. 저장된 배열(빈 배열 포함)은 덮지 않는다.
    // 템플릿 변경으로 스토어를 비운 뒤에는 대학생·성인 시드를 다시 넣지 않는다.
    // GET 행이 있는 상세는 FE 기본 대상으로 채우지 않는다.
    if (
      volunteerRow == null &&
      !isOperationalSeedDefaultSuppressed('ujat-recruit-volunteer', VOLUNTEER_KEYS.volunteerTargets)
    ) {
      next.volunteerTargets = ['university', 'adult']
    }
  } else {
    next.volunteerTargets = normalizeVolunteerTargetList(next.volunteerTargets)
  }
  const programRange = readOverlayRange(overlay, VOLUNTEER_KEYS.programRange)
  const recruitRange =
    readOverlayRange(overlay, VOLUNTEER_KEYS.recruitRange) ??
    readOverlayRange(overlay, VOLUNTEER_KEYS.recruitRangeH1) ??
    readOverlayRange(overlay, VOLUNTEER_KEYS.recruitRangeH2)
  if (volunteerRow == null) {
    if (!next.startDate && programRange?.start?.trim()) next.startDate = programRange.start
    if (!next.endDate && programRange?.end?.trim()) next.endDate = programRange.end
    if (!next.volunteerApplicationStartDate && recruitRange?.start?.trim()) {
      next.volunteerApplicationStartDate = recruitRange.start
    }
    if (!next.volunteerApplicationEndDate && recruitRange?.end?.trim()) {
      next.volunteerApplicationEndDate = recruitRange.end
    }
  }
  return applyUjatRecruitmentRowCopyToForm(next, program, 'volunteer', volunteerHalf)
}

function nonemptyRowText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function applyUjatRecruitmentRowCopyToForm(
  values: ProgramDetailEditFormValues,
  program: Program,
  kind: 'institution' | 'volunteer',
  volunteerHalf?: UjatVolunteerRecruitHalf
): ProgramDetailEditFormValues {
  const row =
    kind === 'volunteer'
      ? pickUjatVolunteerRecruitmentRow(program, volunteerHalf ?? 'h1')
      : pickRecruitmentCopyRow(program, 'participant')
  if (!row) return values
  const announcementTitle = nonemptyRowText(row.announcementTitle)
  const applicationMethod = nonemptyRowText(row.applicationMethod)
  const contactName = nonemptyRowText(row.contactName)
  const contactPhone = nonemptyRowText(row.contactPhone)
  const contactEmail = nonemptyRowText(row.contactEmail)
  const startAt = nonemptyRowText(row.startAt)
  const endAt = nonemptyRowText(row.endAt)
  const operationStart = nonemptyRowText(row.operationStartDate)
  const operationEnd = nonemptyRowText(row.operationEndDate)
  const interviewStart = nonemptyRowText(row.interviewStartAt)
  const interviewEnd = nonemptyRowText(row.interviewEndAt)
  const contactNameField =
    kind === 'institution'
      ? { recruitmentContactOrganizationName: contactName ?? '' }
      : { volunteerRecruitmentContactOrganizationName: contactName ?? '' }
  const halfPeriod =
    kind === 'volunteer'
      ? {
          ...(startAt ? { volunteerApplicationStartDate: startAt } : {}),
          ...(endAt ? { volunteerApplicationEndDate: endAt } : {}),
        }
      : volunteerHalf !== 'h2' && startAt
        ? {
            applicationStartDate: startAt,
            ...(endAt ? { applicationEndDate: endAt } : {}),
          }
        : {}
  return {
    ...values,
    ...(announcementTitle != null ? { announcementTitle } : {}),
    ...(applicationMethod != null ? { applicationMethod } : {}),
    ...(contactName != null ? contactNameField : {}),
    ...(contactPhone != null ? { contactPhone } : {}),
    ...(contactEmail != null ? { contactEmail } : {}),
    ...halfPeriod,
    startDate: operationStart ?? '',
    endDate: operationEnd ?? '',
    ...(kind === 'volunteer'
      ? {
          interviewStartDate: interviewStart ?? '',
          interviewEndDate: interviewEnd ?? '',
        }
      : {}),
    ...(hasRecruitmentCopy(row)
      ? {
          ...(nonemptyRowText(row.programDescription)
            ? { description: row.programDescription!.trim() }
            : {}),
          ...(nonemptyRowText(row.recruitmentGuide)
            ? { recruitmentGuide: row.recruitmentGuide!.trim() }
            : {}),
          ...(nonemptyRowText(row.learningSupportContent)
            ? { learningSupportContent: row.learningSupportContent!.trim() }
            : {}),
          ...(nonemptyRowText(row.additionalContentHtml)
            ? { additionalContentHtml: row.additionalContentHtml!.trim() }
            : {}),
          ...(nonemptyRowText(row.remarks) ? { oneLineIntroduction: row.remarks!.trim() } : {}),
        }
      : {}),
  }
}

function patchRecruitOverlayFromForm(
  kind: 'institution' | 'volunteer',
  values: ProgramDetailEditFormValues,
  dirtyFormField?: string,
  volunteerHalf?: UjatVolunteerRecruitHalf
): void {
  const next =
    kind === 'institution'
      ? buildUjatRecruitInstitutionOverlayFromDetailEditValues(values)
      : volunteerHalf != null
        ? buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(values, volunteerHalf)
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
    volunteerHalf,
  })
  if (kind === 'institution') {
    patchUjatRecruitInstitutionOverlay(merged)
    return
  }
  patchUjatRecruitVolunteerOverlay(merged)
  if (volunteerHalf == null) return
  const interviewRange = merged[ujatVolunteerHalfOverlayKey(volunteerHalf, 'interviewRange')]
  if (interviewRange == null || typeof interviewRange !== 'object') return
  const start = (interviewRange as { start?: unknown }).start
  const end = (interviewRange as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string' || !start.trim() || !end.trim()) return
  patchGeneralRecruitOverlay({
    [ujatVolunteerRecruitInterviewRangeSealKey(volunteerHalf)]: { start, end },
  })
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
  _revision: number,
  volunteerHalf?: UjatVolunteerRecruitHalf
): void {
  const readyRef = useRef(false)
  const programRef = useRef(program)

  useEffect(() => {
    programRef.current = program
  }, [program])

  useEffect(() => {
    readyRef.current = false
    form.reset(programToUjatRecruitTemplateFormValues(programRef.current, kind, volunteerHalf), {
      keepDefaultValues: false,
    })
    readyRef.current = true
  }, [form, kind, volunteerHalf])

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (!readyRef.current) return
      if (info.name == null && info.type == null) return
      const dirtyFormField =
        info.type === 'change' || info.type === 'blur' ? info.name : undefined
      patchRecruitOverlayFromForm(
        kind,
        values as ProgramDetailEditFormValues,
        dirtyFormField,
        volunteerHalf
      )
    })
    return () => subscription.unsubscribe()
  }, [form, kind, volunteerHalf])

  // 모집 단계의 주요 필드는 RHF 값을 렌더링하고, DEV 자동입력은 overlay를
  // 갱신한다. 버튼을 현재 모집 단계에서 누른 경우 overlay만 바뀌고 RHF가
  // 기존 빈 값을 계속 들고 있던 문제를 자동입력 완료 이벤트에서 한 번만
  // 재수화해 해결한다. 일반적인 사용자 입력 변경에는 반응하지 않아
  // 입력 중인 값이 되돌아가지 않는다.
  useEffect(() => {
    const handleDevAutofillComplete = () => {
      readyRef.current = false
      form.reset(
        programToUjatRecruitTemplateFormValues(programRef.current, kind, volunteerHalf),
        { keepDefaultValues: false }
      )
      readyRef.current = true
    }

    window.addEventListener('cms:registration-dev-autofill-complete', handleDevAutofillComplete)
    return () => {
      window.removeEventListener(
        'cms:registration-dev-autofill-complete',
        handleDevAutofillComplete
      )
    }
  }, [form, kind, volunteerHalf])
}
