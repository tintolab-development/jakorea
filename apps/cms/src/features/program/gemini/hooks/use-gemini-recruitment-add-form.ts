import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  isAnnouncementUnpublished,
  type ParticipantRecruitmentAnnouncementPublishedValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import { mergeDevAutofillSparse } from '@/features/program/shared/lib/merge-dev-autofill-sparse'
import { resetAllGeminiRecruitForms } from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-form-rhf'
import type { GeminiRecruitmentEducationForm } from '../lib/recruitment/add-form-options'
import {
  createDefaultGeminiRecruitmentAddFormSnapshot,
  loadGeminiRecruitmentAddDraft,
  normalizeGeminiRecruitmentAddFormSnapshot,
  type GeminiRecruitmentAddFormSnapshot,
} from '../lib/recruitment/add-local-save'
import { buildGeminiRecruitmentDevAutofillSnapshot } from '../lib/recruitment/dev-autofill'
import { useGeminiRecruitmentRichTextGetters } from './use-gemini-recruitment-rich-text-getters'

function toPeriodTuple(
  start: string | null,
  end: string | null
): [Dayjs | null, Dayjs | null] | null {
  if (!start || !end) return null
  const a = dayjs(start)
  const b = dayjs(end)
  if (!a.isValid() || !b.isValid()) return null
  return [a, b]
}

function periodToIso(dates: [Dayjs | null, Dayjs | null] | null): {
  start: string | null
  end: string | null
} {
  const start = dates?.[0]
  const end = dates?.[1]
  if (start == null || end == null) {
    return { start: null, end: null }
  }
  return {
    start: start.startOf('day').toISOString(),
    end: end.startOf('day').toISOString(),
  }
}

function snapshotToFormState(snapshot: GeminiRecruitmentAddFormSnapshot) {
  return {
    title: snapshot.title,
    announcementPublished: snapshot.announcementPublished,
    educationTargetLevels: snapshot.educationTargetLevels,
    educationTargetDetail: snapshot.educationTargetDetail,
    applicationPeriod: toPeriodTuple(
      snapshot.applicationPeriodStart,
      snapshot.applicationPeriodEnd
    ),
    trainingRequestPeriod: toPeriodTuple(
      snapshot.trainingRequestPeriodStart,
      snapshot.trainingRequestPeriodEnd
    ),
    minStudentCount:
      typeof snapshot.minStudentCount === 'number' && Number.isFinite(snapshot.minStudentCount)
        ? snapshot.minStudentCount
        : undefined,
    educationForm: snapshot.educationForm,
    inquiryContactName: snapshot.inquiryContactName,
    inquiryTel: snapshot.inquiryTel,
    inquiryEmail: snapshot.inquiryEmail,
    notesNotApplicable: snapshot.notesNotApplicable,
    notes: snapshot.notes,
    thumbnailFileName: snapshot.thumbnailFileName,
    thumbnailFileObjectId: snapshot.thumbnailFileObjectId ?? null,
    programDescription: snapshot.programDescription,
    recruitmentGuide: snapshot.recruitmentGuide,
    applicationMethod: snapshot.applicationMethod,
    learningSupportContent: snapshot.learningSupportContent,
    additionalContentMarkdown: snapshot.additionalContentMarkdown,
    attachmentFileNames: snapshot.attachmentFileNames,
    attachmentFileObjectIds: snapshot.attachmentFileObjectIds,
    institutionSectionDescription: snapshot.institutionSectionDescription,
    detailSectionDescription: snapshot.detailSectionDescription,
  }
}

function isPeriodComplete(dates: [Dayjs | null, Dayjs | null] | null): boolean {
  return dates?.[0] != null && dates[1] != null
}

function hasFilledText(value: string): boolean {
  return value.trim().length > 0
}

/**
 * 「참여 기관 모집 정보」필수 항목.
 * 상세 정보는 공란 허용(홈페이지에서 미노출).
 */
function isInstitutionRecruitmentComplete(input: {
  title: string
  announcementPublished: ParticipantRecruitmentAnnouncementPublishedValue | ''
  educationTargetLevels: string[]
  educationTargetDetail: string
  applicationPeriod: [Dayjs | null, Dayjs | null] | null
  trainingRequestPeriod: [Dayjs | null, Dayjs | null] | null
  minStudentCount: number | undefined
  educationForm: GeminiRecruitmentEducationForm
  inquiryContactName: string
  inquiryTel: string
  inquiryEmail: string
  notesNotApplicable: boolean
  notes: string
}): boolean {
  const count = input.minStudentCount ?? 0
  const skipPeriods = isAnnouncementUnpublished(input.announcementPublished)
  return (
    hasFilledText(input.title) &&
    (input.announcementPublished === 'published' ||
      input.announcementPublished === 'unpublished') &&
    input.educationTargetLevels.length > 0 &&
    hasFilledText(input.educationTargetDetail) &&
    (skipPeriods || isPeriodComplete(input.applicationPeriod)) &&
    (skipPeriods || isPeriodComplete(input.trainingRequestPeriod)) &&
    count >= 1 &&
    (input.educationForm === 'online' || input.educationForm === 'offline') &&
    hasFilledText(input.inquiryContactName) &&
    hasFilledText(input.inquiryTel) &&
    hasFilledText(input.inquiryEmail) &&
    (input.notesNotApplicable || hasFilledText(input.notes))
  )
}

export function useGeminiRecruitmentAddForm(
  open: boolean,
  options?: { skipDraftRestore?: boolean }
) {
  const skipDraftRestore = options?.skipDraftRestore === true
  const [hydrated, setHydrated] = useState(false)
  const [title, setTitle] = useState('')
  const [announcementPublished, setAnnouncementPublished] =
    useState<ParticipantRecruitmentAnnouncementPublishedValue | ''>('')
  const [educationTargetLevels, setEducationTargetLevels] = useState<string[]>([])
  const [educationTargetDetail, setEducationTargetDetail] = useState('')
  const [applicationPeriod, setApplicationPeriod] = useState<[Dayjs | null, Dayjs | null] | null>(
    null
  )
  const [trainingRequestPeriod, setTrainingRequestPeriod] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)
  const [minStudentCount, setMinStudentCount] = useState<number | undefined>(undefined)
  const [educationForm, setEducationForm] = useState<GeminiRecruitmentEducationForm>('online')
  const [inquiryContactName, setInquiryContactName] = useState('')
  const [inquiryTel, setInquiryTel] = useState('')
  const [inquiryEmail, setInquiryEmail] = useState('')
  const [notesNotApplicable, setNotesNotApplicable] = useState(false)
  const [notes, setNotes] = useState('')
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null)
  const [thumbnailFileObjectId, setThumbnailFileObjectId] = useState<number | null>(null)
  const [programDescription, setProgramDescription] = useState('')
  const [recruitmentGuide, setRecruitmentGuide] = useState('')
  const [applicationMethod, setApplicationMethod] = useState('')
  const [learningSupportContent, setLearningSupportContent] = useState('')
  const [additionalContentMarkdown, setAdditionalContentMarkdown] = useState('')
  const [attachmentFileNames, setAttachmentFileNames] = useState<string[]>([])
  const [attachmentFileObjectIds, setAttachmentFileObjectIds] = useState<
    Array<number | null> | undefined
  >(undefined)
  const [institutionSectionDescription, setInstitutionSectionDescription] = useState('')
  const [detailSectionDescription, setDetailSectionDescription] = useState('')

  const baselineRef = useRef<string>('')
  const { registerRichTextGetter, overlayRichText } = useGeminiRecruitmentRichTextGetters()
  const [richTextTouched, setRichTextTouched] = useState(false)
  const markRichTextTouched = useCallback(() => {
    setRichTextTouched(true)
  }, [])

  const applyFormState = useCallback((snapshot: GeminiRecruitmentAddFormSnapshot) => {
    const next = snapshotToFormState(snapshot)
    setTitle(next.title)
    setAnnouncementPublished(next.announcementPublished)
    setEducationTargetLevels(next.educationTargetLevels)
    setEducationTargetDetail(next.educationTargetDetail)
    setApplicationPeriod(next.applicationPeriod)
    setTrainingRequestPeriod(next.trainingRequestPeriod)
    setMinStudentCount(next.minStudentCount)
    setEducationForm(next.educationForm)
    setInquiryContactName(next.inquiryContactName)
    setInquiryTel(next.inquiryTel)
    setInquiryEmail(next.inquiryEmail)
    setNotesNotApplicable(next.notesNotApplicable)
    setNotes(next.notes)
    setThumbnailFileName(next.thumbnailFileName)
    setThumbnailFileObjectId(next.thumbnailFileObjectId)
    setProgramDescription(next.programDescription)
    setRecruitmentGuide(next.recruitmentGuide)
    setApplicationMethod(next.applicationMethod)
    setLearningSupportContent(next.learningSupportContent)
    setAdditionalContentMarkdown(next.additionalContentMarkdown)
    setAttachmentFileNames(next.attachmentFileNames)
    setAttachmentFileObjectIds(next.attachmentFileObjectIds)
    setInstitutionSectionDescription(next.institutionSectionDescription)
    setDetailSectionDescription(next.detailSectionDescription)
    baselineRef.current = JSON.stringify(normalizeGeminiRecruitmentAddFormSnapshot(snapshot))
    setRichTextTouched(false)
  }, [])

  useEffect(() => {
    if (!open) {
      resetAllGeminiRecruitForms()
      setHydrated(false)
      return
    }

    if (skipDraftRestore) {
      resetAllGeminiRecruitForms()
      applyFormState(createDefaultGeminiRecruitmentAddFormSnapshot())
    } else {
      const saved = loadGeminiRecruitmentAddDraft()
      if (saved?.form) {
        applyFormState(saved.form)
      } else {
        applyFormState(createDefaultGeminiRecruitmentAddFormSnapshot())
      }
    }
    setHydrated(true)
  }, [applyFormState, open, skipDraftRestore])

  const handleMinStudentCountChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    setMinStudentCount(digits ? Number(digits) : undefined)
  }, [])

  const buildSaveSnapshot = useCallback((): GeminiRecruitmentAddFormSnapshot => {
    const application = periodToIso(applicationPeriod)
    const trainingRequest = periodToIso(trainingRequestPeriod)
    return normalizeGeminiRecruitmentAddFormSnapshot(
      overlayRichText({
        title,
        announcementPublished,
        educationTargetLevels,
        educationTargetDetail,
        applicationPeriodStart: application.start,
        applicationPeriodEnd: application.end,
        trainingRequestPeriodStart: trainingRequest.start,
        trainingRequestPeriodEnd: trainingRequest.end,
        minStudentCount: minStudentCount ?? null,
        educationForm,
        inquiryContactName,
        inquiryTel,
        inquiryEmail,
        notesNotApplicable,
        notes,
        thumbnailFileName,
        ...(thumbnailFileObjectId != null ? { thumbnailFileObjectId } : {}),
        programDescription,
        recruitmentGuide,
        applicationMethod,
        learningSupportContent,
        additionalContentMarkdown,
        attachmentFileNames,
        ...(attachmentFileObjectIds !== undefined ? { attachmentFileObjectIds } : {}),
        institutionSectionDescription,
        detailSectionDescription,
      })
    )
  }, [
    additionalContentMarkdown,
    announcementPublished,
    applicationMethod,
    applicationPeriod,
    attachmentFileNames,
    attachmentFileObjectIds,
    detailSectionDescription,
    educationForm,
    educationTargetDetail,
    educationTargetLevels,
    inquiryContactName,
    inquiryEmail,
    inquiryTel,
    institutionSectionDescription,
    learningSupportContent,
    minStudentCount,
    notes,
    notesNotApplicable,
    overlayRichText,
    programDescription,
    recruitmentGuide,
    thumbnailFileName,
    thumbnailFileObjectId,
    title,
    trainingRequestPeriod,
  ])

  const isDirty = useMemo(() => {
    if (!hydrated) return false
    return JSON.stringify(buildSaveSnapshot()) !== baselineRef.current
  }, [buildSaveSnapshot, hydrated, richTextTouched])

  const isRegisterReady = useMemo(
    () =>
      hydrated &&
      isInstitutionRecruitmentComplete({
        title,
        announcementPublished,
        educationTargetLevels,
        educationTargetDetail,
        applicationPeriod,
        trainingRequestPeriod,
        minStudentCount,
        educationForm,
        inquiryContactName,
        inquiryTel,
        inquiryEmail,
        notesNotApplicable,
        notes,
      }),
    [
      announcementPublished,
      applicationPeriod,
      educationForm,
      educationTargetDetail,
      educationTargetLevels,
      hydrated,
      inquiryContactName,
      inquiryEmail,
      inquiryTel,
      minStudentCount,
      notes,
      notesNotApplicable,
      title,
      trainingRequestPeriod,
    ]
  )

  const markSavedBaseline = useCallback(() => {
    baselineRef.current = JSON.stringify(buildSaveSnapshot())
    setRichTextTouched(false)
  }, [buildSaveSnapshot])

  /** 개발용 — 비어 있는 필드만 채운다. 이미 고른 공고 게시 여부는 유지한다. */
  const applyDevAutofill = useCallback(() => {
    if (!import.meta.env.DEV) return
    const filled = buildGeminiRecruitmentDevAutofillSnapshot()
    const merged = mergeDevAutofillSparse(
      buildSaveSnapshot() as unknown as Record<string, unknown>,
      filled as unknown as Record<string, unknown>
    ) as GeminiRecruitmentAddFormSnapshot
    applyFormState(merged)
  }, [applyFormState, buildSaveSnapshot])

  return {
    hydrated,
    title,
    setTitle,
    announcementPublished,
    setAnnouncementPublished,
    educationTargetLevels,
    setEducationTargetLevels,
    educationTargetDetail,
    setEducationTargetDetail,
    applicationPeriod,
    setApplicationPeriod,
    trainingRequestPeriod,
    setTrainingRequestPeriod,
    minStudentCount,
    handleMinStudentCountChange,
    educationForm,
    setEducationForm,
    inquiryContactName,
    setInquiryContactName,
    inquiryTel,
    setInquiryTel,
    inquiryEmail,
    setInquiryEmail,
    notesNotApplicable,
    setNotesNotApplicable,
    notes,
    setNotes,
    thumbnailFileName,
    setThumbnailFileName,
    thumbnailFileObjectId,
    setThumbnailFileObjectId,
    programDescription,
    setProgramDescription,
    recruitmentGuide,
    setRecruitmentGuide,
    applicationMethod,
    setApplicationMethod,
    learningSupportContent,
    setLearningSupportContent,
    additionalContentMarkdown,
    registerRichTextGetter,
    markRichTextTouched,
    attachmentFileNames,
    setAttachmentFileNames,
    attachmentFileObjectIds,
    setAttachmentFileObjectIds,
    institutionSectionDescription,
    setInstitutionSectionDescription,
    detailSectionDescription,
    setDetailSectionDescription,
    buildSaveSnapshot,
    isDirty,
    isRegisterReady,
    markSavedBaseline,
    applyDevAutofill,
  }
}
