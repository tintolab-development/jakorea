import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { GeminiRecruitmentInstitutionFields } from '@/features/program/gemini/ui/recruitment/gemini-recruitment-institution-fields'
import type { GeminiRecruitmentFormFieldValues } from '@/features/program/gemini/lib/recruitment/format-recruitment-fields'
import type { GeminiRecruitmentEducationForm } from '@/features/program/gemini/lib/recruitment/add-form-options'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  GEMINI_RECRUIT_OVERLAY_KEYS,
  useGeminiRecruitOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function parsePeriodFromOverlay(
  startIso: string | null,
  endIso: string | null
): [Dayjs | null, Dayjs | null] | null {
  if (startIso == null && endIso == null) return null
  return [startIso ? dayjs(startIso) : null, endIso ? dayjs(endIso) : null]
}

function serializePeriodToOverlay(period: [Dayjs | null, Dayjs | null] | null): {
  start: string | null
  end: string | null
} {
  if (period == null) return { start: null, end: null }
  return {
    start: period[0]?.toISOString() ?? null,
    end: period[1]?.toISOString() ?? null,
  }
}

/** Gemini 찾아가는 연수 모집 폼 — 참여 기관 모집 정보 단락 */
export function GeminiRecruitInstitutionInfoParagraph() {
  const [title, setTitle] = useGeminiRecruitOverlayKv(GEMINI_RECRUIT_OVERLAY_KEYS.title, '')
  const [announcementPublished, setAnnouncementPublished] = useGeminiRecruitOverlayKv<
    ParticipantRecruitmentAnnouncementPublishedValue
  >(GEMINI_RECRUIT_OVERLAY_KEYS.announcementPublished, 'published')
  const [educationTargetLevels, setEducationTargetLevels] = useGeminiRecruitOverlayKv<string[]>(
    GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetLevels,
    []
  )
  const [educationTargetDetail, setEducationTargetDetail] = useGeminiRecruitOverlayKv(
    GEMINI_RECRUIT_OVERLAY_KEYS.educationTargetDetail,
    ''
  )
  const [applicationPeriodStart, setApplicationPeriodStart] = useGeminiRecruitOverlayKv<
    string | null
  >(GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodStart, null)
  const [applicationPeriodEnd, setApplicationPeriodEnd] = useGeminiRecruitOverlayKv<string | null>(
    GEMINI_RECRUIT_OVERLAY_KEYS.applicationPeriodEnd,
    null
  )
  const [trainingRequestPeriodStart, setTrainingRequestPeriodStart] = useGeminiRecruitOverlayKv<
    string | null
  >(GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodStart, null)
  const [trainingRequestPeriodEnd, setTrainingRequestPeriodEnd] = useGeminiRecruitOverlayKv<
    string | null
  >(GEMINI_RECRUIT_OVERLAY_KEYS.trainingRequestPeriodEnd, null)
  const [minStudentCount, setMinStudentCount] = useGeminiRecruitOverlayKv<number | null>(
    GEMINI_RECRUIT_OVERLAY_KEYS.minStudentCount,
    15
  )
  const [educationForm, setEducationForm] = useGeminiRecruitOverlayKv<GeminiRecruitmentEducationForm>(
    GEMINI_RECRUIT_OVERLAY_KEYS.educationForm,
    'online'
  )
  const [inquiryContactName, setInquiryContactName] = useGeminiRecruitOverlayKv(
    GEMINI_RECRUIT_OVERLAY_KEYS.inquiryContactName,
    ''
  )
  const [inquiryTel, setInquiryTel] = useGeminiRecruitOverlayKv(
    GEMINI_RECRUIT_OVERLAY_KEYS.inquiryTel,
    ''
  )
  const [inquiryEmail, setInquiryEmail] = useGeminiRecruitOverlayKv(
    GEMINI_RECRUIT_OVERLAY_KEYS.inquiryEmail,
    ''
  )
  const [notesNotApplicable, setNotesNotApplicable] = useGeminiRecruitOverlayKv(
    GEMINI_RECRUIT_OVERLAY_KEYS.notesNotApplicable,
    false
  )
  const [notes, setNotes] = useGeminiRecruitOverlayKv(GEMINI_RECRUIT_OVERLAY_KEYS.notes, '')

  const values = useMemo<GeminiRecruitmentFormFieldValues>(
    () => ({
      title,
      announcementPublished,
      educationTargetLevels,
      educationTargetDetail,
      applicationPeriodStart,
      applicationPeriodEnd,
      trainingRequestPeriodStart,
      trainingRequestPeriodEnd,
      minStudentCount,
      educationForm,
      inquiryContactName,
      inquiryTel,
      inquiryEmail,
      notesNotApplicable,
      notes,
      thumbnailFileName: null,
      programDescription: '',
      recruitmentGuide: '',
      applicationMethod: '',
      learningSupportContent: '',
      additionalContentMarkdown: '',
      attachmentFileNames: [],
    }),
    [
      title,
      announcementPublished,
      educationTargetLevels,
      educationTargetDetail,
      applicationPeriodStart,
      applicationPeriodEnd,
      trainingRequestPeriodStart,
      trainingRequestPeriodEnd,
      minStudentCount,
      educationForm,
      inquiryContactName,
      inquiryTel,
      inquiryEmail,
      notesNotApplicable,
      notes,
    ]
  )

  const applicationPeriod = useMemo(
    () => parsePeriodFromOverlay(applicationPeriodStart, applicationPeriodEnd),
    [applicationPeriodEnd, applicationPeriodStart]
  )
  const trainingRequestPeriod = useMemo(
    () => parsePeriodFromOverlay(trainingRequestPeriodStart, trainingRequestPeriodEnd),
    [trainingRequestPeriodEnd, trainingRequestPeriodStart]
  )

  const handleApplicationPeriodChange = (period: [Dayjs | null, Dayjs | null] | null) => {
    const { start, end } = serializePeriodToOverlay(period)
    setApplicationPeriodStart(start)
    setApplicationPeriodEnd(end)
  }

  const handleTrainingRequestPeriodChange = (period: [Dayjs | null, Dayjs | null] | null) => {
    const { start, end } = serializePeriodToOverlay(period)
    setTrainingRequestPeriodStart(start)
    setTrainingRequestPeriodEnd(end)
  }

  const handleMinStudentCountChange = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') {
      setMinStudentCount(null)
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    if (Number.isFinite(parsed) && parsed >= 0) {
      setMinStudentCount(parsed)
    }
  }

  const handleChange = (patch: Partial<GeminiRecruitmentFormFieldValues>) => {
    if (patch.title !== undefined) setTitle(patch.title)
    if (patch.announcementPublished !== undefined) setAnnouncementPublished(patch.announcementPublished)
    if (patch.educationTargetLevels !== undefined) setEducationTargetLevels(patch.educationTargetLevels)
    if (patch.educationTargetDetail !== undefined) setEducationTargetDetail(patch.educationTargetDetail)
    if (patch.educationForm !== undefined) {
      setEducationForm(patch.educationForm as GeminiRecruitmentEducationForm)
    }
    if (patch.inquiryContactName !== undefined) setInquiryContactName(patch.inquiryContactName)
    if (patch.inquiryTel !== undefined) setInquiryTel(patch.inquiryTel)
    if (patch.inquiryEmail !== undefined) setInquiryEmail(patch.inquiryEmail)
    if (patch.notesNotApplicable !== undefined) setNotesNotApplicable(patch.notesNotApplicable)
    if (patch.notes !== undefined) setNotes(patch.notes)
  }

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
        <GeminiRecruitmentInstitutionFields
          mode="edit"
          values={values}
          showAnnouncementRow
          applicationPeriod={applicationPeriod}
          onApplicationPeriodChange={handleApplicationPeriodChange}
          trainingRequestPeriod={trainingRequestPeriod}
          onTrainingRequestPeriodChange={handleTrainingRequestPeriodChange}
          onMinStudentCountChange={handleMinStudentCountChange}
          onChange={handleChange}
        />
      </DetailInfoForm>
    </div>
  )
}
