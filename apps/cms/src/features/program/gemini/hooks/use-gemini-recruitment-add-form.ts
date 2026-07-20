import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import type { GeminiRecruitmentEducationForm } from '../lib/recruitment/add-form-options'
import {
  createDefaultGeminiRecruitmentAddFormSnapshot,
  loadGeminiRecruitmentAddDraft,
  normalizeGeminiRecruitmentAddFormSnapshot,
  type GeminiRecruitmentAddFormSnapshot,
} from '../lib/recruitment/add-local-save'

const WYSIWYG_RESET_KEY = 'gemini-visiting-training-recruitment-add'

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
    programDescription: snapshot.programDescription,
    recruitmentGuide: snapshot.recruitmentGuide,
    applicationMethod: snapshot.applicationMethod,
    learningSupportContent: snapshot.learningSupportContent,
    additionalContentMarkdown: snapshot.additionalContentMarkdown,
    attachmentFileNames: snapshot.attachmentFileNames,
    institutionSectionDescription: snapshot.institutionSectionDescription,
    detailSectionDescription: snapshot.detailSectionDescription,
  }
}

function isPeriodComplete(dates: [Dayjs | null, Dayjs | null] | null): boolean {
  return dates?.[0] != null && dates[1] != null
}

export function useGeminiRecruitmentAddForm(open: boolean) {
  const [hydrated, setHydrated] = useState(false)
  const [title, setTitle] = useState('')
  const [announcementPublished, setAnnouncementPublished] =
    useState<ParticipantRecruitmentAnnouncementPublishedValue>('published')
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
  const [programDescription, setProgramDescription] = useState('')
  const [recruitmentGuide, setRecruitmentGuide] = useState('')
  const [applicationMethod, setApplicationMethod] = useState('')
  const [learningSupportContent, setLearningSupportContent] = useState('')
  const [additionalContentMarkdown, setAdditionalContentMarkdown] = useState('')
  const [attachmentFileNames, setAttachmentFileNames] = useState<string[]>([])
  const [institutionSectionDescription, setInstitutionSectionDescription] = useState('')
  const [detailSectionDescription, setDetailSectionDescription] = useState('')

  const baselineRef = useRef<string>('')

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
    setProgramDescription(next.programDescription)
    setRecruitmentGuide(next.recruitmentGuide)
    setApplicationMethod(next.applicationMethod)
    setLearningSupportContent(next.learningSupportContent)
    setAdditionalContentMarkdown(next.additionalContentMarkdown)
    setAttachmentFileNames(next.attachmentFileNames)
    setInstitutionSectionDescription(next.institutionSectionDescription)
    setDetailSectionDescription(next.detailSectionDescription)
    baselineRef.current = JSON.stringify(normalizeGeminiRecruitmentAddFormSnapshot(snapshot))
  }, [])

  useEffect(() => {
    if (!open) {
      setHydrated(false)
      return
    }

    const saved = loadGeminiRecruitmentAddDraft()
    if (saved?.form) {
      applyFormState(saved.form)
    } else {
      applyFormState(createDefaultGeminiRecruitmentAddFormSnapshot())
    }
    setHydrated(true)
  }, [applyFormState, open])

  const editorOpen = open && hydrated
  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    editorOpen,
    additionalContentMarkdown,
    `${WYSIWYG_RESET_KEY}-${hydrated ? 'ready' : 'pending'}`,
    {
      placeholder: '내용을 작성하세요',
    }
  )

  const handleMinStudentCountChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '')
    setMinStudentCount(digits ? Number(digits) : undefined)
  }, [])

  const buildSaveSnapshot = useCallback((): GeminiRecruitmentAddFormSnapshot => {
    const application = periodToIso(applicationPeriod)
    const trainingRequest = periodToIso(trainingRequestPeriod)
    return normalizeGeminiRecruitmentAddFormSnapshot({
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
      programDescription,
      recruitmentGuide,
      applicationMethod,
      learningSupportContent,
      additionalContentMarkdown: getMarkdown(),
      attachmentFileNames,
      institutionSectionDescription,
      detailSectionDescription,
    })
  }, [
    announcementPublished,
    applicationMethod,
    applicationPeriod,
    attachmentFileNames,
    educationForm,
    educationTargetDetail,
    educationTargetLevels,
    getMarkdown,
    inquiryContactName,
    inquiryEmail,
    inquiryTel,
    learningSupportContent,
    minStudentCount,
    notes,
    notesNotApplicable,
    programDescription,
    recruitmentGuide,
    institutionSectionDescription,
    detailSectionDescription,
    thumbnailFileName,
    title,
    trainingRequestPeriod,
  ])

  const isDirty = useMemo(() => {
    if (!hydrated) return false
    return JSON.stringify(buildSaveSnapshot()) !== baselineRef.current
  }, [buildSaveSnapshot, hydrated])

  const isRegisterReady = useMemo(() => {
    if (!hydrated) return false
    const count = minStudentCount ?? 0
    return (
      title.trim().length > 0 &&
      isPeriodComplete(applicationPeriod) &&
      isPeriodComplete(trainingRequestPeriod) &&
      count >= 1 &&
      (educationForm === 'online' || educationForm === 'offline')
    )
  }, [
    applicationPeriod,
    educationForm,
    hydrated,
    minStudentCount,
    title,
    trainingRequestPeriod,
  ])

  const markSavedBaseline = useCallback(() => {
    baselineRef.current = JSON.stringify(buildSaveSnapshot())
  }, [buildSaveSnapshot])

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
    programDescription,
    setProgramDescription,
    recruitmentGuide,
    setRecruitmentGuide,
    applicationMethod,
    setApplicationMethod,
    learningSupportContent,
    setLearningSupportContent,
    attachmentFileNames,
    setAttachmentFileNames,
    institutionSectionDescription,
    setInstitutionSectionDescription,
    detailSectionDescription,
    setDetailSectionDescription,
    editor,
    editorMinHeight,
    buildSaveSnapshot,
    isDirty,
    isRegisterReady,
    markSavedBaseline,
  }
}
